import { ScrollView, View, Text, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Edit2, AppWindow, Info, Bell, Lock, LogOut, Briefcase } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/AuthContext';

export default function ProfilScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const konfirm = window.confirm('Apakah Anda yakin ingin keluar?');
      if (konfirm) {
        await logout();
      }
    } else {
      Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Keluar', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
          } 
        }
      ]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row justify-center py-4 bg-white border-b border-slate-100">
        <Text className="text-xl font-bold text-slate-800">Profil & Pengaturan</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Card Profil */}
        <View className="bg-white rounded-3xl p-6 items-center shadow-sm shadow-slate-200 border border-slate-100 mb-8">
          <View className="relative mb-4">
            <View className="w-24 h-24 bg-orange-100 rounded-full items-center justify-center overflow-hidden">
              {user?.foto ? (
                <Image source={{ uri: user.foto }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-4xl">👨‍💼</Text> // Fallback
              )}
            </View>
            <TouchableOpacity className="absolute bottom-0 right-0 bg-blue-600 w-8 h-8 rounded-full items-center justify-center border-2 border-white">
              <Edit2 size={14} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-2xl font-bold text-slate-900 mb-1">{user?.nama || user?.username || 'Memuat...'}</Text>
          <Text className="text-blue-600 font-medium text-sm mb-3 uppercase tracking-wider">{user?.role || 'Akses Terbatas'}</Text>
          
          <View className="bg-slate-100 px-4 py-2 rounded-full flex-row items-center">
            <Briefcase size={14} color="#64748b" className="mr-2" />
            <Text className="text-slate-500 text-xs font-bold">NIP: {user?.nip || '-'}</Text>
          </View>
        </View>

        {/* Informasi Aplikasi */}
        <Text className="text-slate-500 font-bold text-xs tracking-wider mb-3">INFORMASI APLIKASI</Text>
        <View className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100 mb-8 overflow-hidden">
          <View className="flex-row items-center justify-between p-4 border-b border-slate-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mr-3">
                <AppWindow size={20} color="#1d4ed8" />
              </View>
              <Text className="text-slate-700 font-medium">Nama Aplikasi</Text>
            </View>
            <Text className="text-slate-900 font-bold text-sm">BPS Paket</Text>
          </View>

          <View className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mr-3">
                <Info size={20} color="#1d4ed8" />
              </View>
              <Text className="text-slate-700 font-medium">Versi</Text>
            </View>
            <View className="bg-slate-100 px-3 py-1 rounded-lg">
              <Text className="text-slate-500 font-medium text-xs">v1.2.0</Text>
            </View>
          </View>
        </View>

        {/* Umum */}
        <Text className="text-slate-500 font-bold text-xs tracking-wider mb-3">UMUM</Text>
        <View className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100 mb-8 overflow-hidden">
          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-slate-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-3">
                <Bell size={20} color="#64748b" />
              </View>
              <Text className="text-slate-700 font-medium">Notifikasi</Text>
            </View>
            <Text className="text-slate-300 font-bold text-lg">{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-3">
                <Lock size={20} color="#64748b" />
              </View>
              <Text className="text-slate-700 font-medium">Ubah Kata Sandi</Text>
            </View>
            <Text className="text-slate-300 font-bold text-lg">{'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* Keluar */}
        <TouchableOpacity 
          onPress={handleLogout}
          className="bg-red-50 py-4 rounded-2xl items-center justify-center flex-row mb-6 border border-red-100"
        >
          <LogOut size={20} color="#dc2626" className="mr-2" />
          <Text className="text-red-600 font-bold text-base">Keluar</Text>
        </TouchableOpacity>

        <Text className="text-center text-slate-400 text-xs mb-10">
          © 2024 Badan Pusat Statistik
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
