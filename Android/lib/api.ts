import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.12.12.109:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function getSecureItem(key: string) {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.error('Local storage unavailable:', e);
      return null;
    }
  } else {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.error('SecureStore error:', e);
      return null;
    }
  }
  return null;
}

async function deleteSecureItem(key: string) {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error('Local storage unavailable:', e);
    }
  } else {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.error('SecureStore error:', e);
    }
  }
}

// Interceptor to inject token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getSecureItem('bps_paket_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token in interceptor:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      try {
        await deleteSecureItem('bps_paket_token');
        await deleteSecureItem('bps_paket_user');
      } catch (e) {
        console.error('Error clearing secure store', e);
      }
      // Redirect logic is handled within the AuthContext / Expo Router automatically
    }
    return Promise.reject(error);
  }
);

export default api;
