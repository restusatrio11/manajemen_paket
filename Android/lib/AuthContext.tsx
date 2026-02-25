import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { Platform } from 'react-native';
import api from './api';

interface User {
  id: number;
  username: string;
  nama_lengkap?: string;
  nama?: string;
  nip?: string;
  foto?: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to handle secure storage across platforms
export async function saveSecureItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getSecureItem(key: string) {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.error('Local storage is unavailable:', e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
  return null;
}

export async function deleteSecureItem(key: string) {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Check local store
    async function initAuth() {
      try {
        const storedToken = await getSecureItem('bps_paket_token');
        const storedUserJSON = await getSecureItem('bps_paket_user');

        if (storedToken && storedUserJSON) {
          setToken(storedToken);
          setUser(JSON.parse(storedUserJSON));

          // Verify token
          api.get('/auth/me')
            .then(res => {
              setUser(res.data.data);
            })
            .catch(async () => {
              // Failed to verify, clear local
              await deleteSecureItem('bps_paket_token');
              await deleteSecureItem('bps_paket_user');
              setToken(null);
              setUser(null);
            });
        }
      } catch (error) {
        console.error('Failed to load auth state', error);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  // Route guarding based on segments
  useEffect(() => {
    if (loading) return; // Wait until initial auth check is done

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    // if index (splash), don't guard it yet, let it handle its own timeout
    if (!segments.length || (segments[0] as string) === '') return;

    if (!token && !inAuthGroup && !inOnboarding) {
      // Not logged in, trying to access protected route -> send to login
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // Logged in, trying to access auth wrapper -> send to tabs
      router.replace('/(tabs)');
    }
  }, [token, segments, loading]);

  const login = async (newToken: string, newUser: User) => {
    await saveSecureItem('bps_paket_token', newToken);
    await saveSecureItem('bps_paket_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    router.replace('/(tabs)');
  };

  const logout = async () => {
    await deleteSecureItem('bps_paket_token');
    await deleteSecureItem('bps_paket_user');
    setToken(null);
    setUser(null);
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
