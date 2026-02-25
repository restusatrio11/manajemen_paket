import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, User } from 'lucide-react-native';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      if (Platform.OS === 'web') window.alert('Mohon isi username dan password');
      else Alert.alert('Gagal', 'Mohon isi username dan password');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      
      const { token, user } = response.data.data;
      
      if (token && user) {
        // use auth context
        await login(token, user);
      } else {
        if (Platform.OS === 'web') window.alert('Respons server tidak valid');
        else Alert.alert('Gagal Login', 'Respons server tidak valid');
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Gagal terhubung ke server. Periksa koneksi Anda.';
      if (Platform.OS === 'web') window.alert('Login Gagal: ' + errorMsg);
      else Alert.alert('Login Gagal', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Centered Card for Web/Tablet constraints */}
          <View className="w-full max-w-sm mx-auto bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
            
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-blue-50 rounded-2xl items-center justify-center mb-5 border border-blue-100 overflow-hidden">
                <Image source={require('../../assets/images/icon.png')} className="w-16 h-16" resizeMode="contain" />
              </View>
              <Text className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Login Paket Wak</Text>
              <Text className="text-slate-500 text-center text-sm leading-relaxed px-2">
                Silakan masuk menggunakan NIP atau Username Anda
              </Text>
            </View>

            <View className="mb-5">
              <Text className="text-slate-700 font-bold text-xs uppercase tracking-wider mb-2 ml-1">Username / NIP</Text>
              <View className="flex-row items-center bg-slate-50 rounded-2xl border border-slate-200 px-4 h-14 focus:border-blue-500 focus:bg-white">
                <User size={20} color="#94a3b8" className="mr-3" />
                <TextInput
                  className="flex-1 text-slate-900 text-base h-full"
                  placeholder="Masukkan NIP Anda"
                  placeholderTextColor="#cbd5e1"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-slate-700 font-bold text-xs uppercase tracking-wider mb-2 ml-1">Password</Text>
              <View className="flex-row items-center bg-slate-50 rounded-2xl border border-slate-200 px-4 h-14 focus:border-blue-500 focus:bg-white">
                <Lock size={20} color="#94a3b8" className="mr-3" />
                <TextInput
                  className="flex-1 text-slate-900 text-base h-full"
                  placeholder="Masukkan password"
                  placeholderTextColor="#cbd5e1"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2 -mr-2">
                  {showPassword ? (
                    <EyeOff size={20} color="#94a3b8" />
                  ) : (
                    <Eye size={20} color="#94a3b8" />
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity className="mt-4 self-end">
                <Text className="text-blue-600 font-bold text-sm">Lupa Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`w-full py-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-blue-200 mt-2 ${
                loading ? 'bg-blue-400' : 'bg-blue-600'
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" className="mr-2" />
              ) : null}
              <Text className="text-white font-bold text-lg tracking-wide">
                {loading ? 'Masuk...' : 'Masuk'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8 items-center">
             <Text className="text-slate-400 text-xs font-medium">Bantuan hubungi Administrator Sistem.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
