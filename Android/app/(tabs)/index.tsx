import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, ToastAndroid, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Package, CheckCircle, Box, Archive, Truck, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    total: 0,
    menunggu_diambil: 0,
    sudah_diambil: 0,
    masuk_hari_ini: 0
  });
  const [recentPackages, setRecentPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const [statsRes, pkgsRes] = await Promise.all([
        api.get(`/paket/stats?month=${currentMonth}&year=${currentYear}`),
        api.get('/paket?limit=5')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (pkgsRes.data.success) {
        setRecentPackages(pkgsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handleTambahPaket = () => {
    router.push('/paket/tambah');
  };

  const getPackageIcon = (ekspedisi: string) => {
    const name = (ekspedisi || '').toLowerCase();
    if (name.includes('jne') || name.includes('j&t')) return <Box size={24} color="#1d4ed8" />;
    if (name.includes('pos')) return <Archive size={24} color="#1d4ed8" />;
    return <Truck size={24} color="#1d4ed8" />;
  };

  const processAmbil = async (pkg: any) => {
    try {
      const res = await api.put(`/paket/${pkg.id}/ambil`, {});
      if (res.data.success) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Status paket: Diambil!', ToastAndroid.SHORT);
        } else if (Platform.OS === 'web') {
          window.alert('Sukses: Status paket berhasil diperbarui!');
        } else {
          Alert.alert('Sukses', 'Status paket berhasil diperbarui!');
        }
        fetchData();
      }
    } catch(e: any) {
      if (Platform.OS === 'web') {
         window.alert('Gagal: ' + (e.response?.data?.message || 'Gagal mengubah status paket'));
      } else {
         Alert.alert('Gagal', e.response?.data?.message || 'Gagal mengubah status paket');
      }
    }
  };

  const confirmAmbil = (pkg: any) => {
    if (pkg.status === 'sudah_diambil') return;

    if (Platform.OS === 'web') {
      const konfirm = window.confirm(`Tandai paket ${pkg.pegawai?.nama || `PKG-${pkg.id}`} sudah diambil penerima?`);
      if (konfirm) {
        processAmbil(pkg);
      }
    } else {
      Alert.alert(
        'Konfirmasi Pengambilan',
        `Tandai paket ${pkg.pegawai?.nama || `PKG-${pkg.id}`} sudah diambil penerima?`,
        [
          { text: 'Batal', style: 'cancel' },
          { 
            text: 'Ya, Diambil', 
            onPress: () => processAmbil(pkg)
          }
        ]
      );
    }
  };

  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  // Safety check to prevent divide by zero
  const completionRate = stats.total > 0 
    ? Math.round((stats.sudah_diambil / stats.total) * 100) 
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView 
        className="flex-1 px-6 py-4" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1d4ed8']} />}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8 mt-2">
          <View>
            <Text className="text-slate-500 text-sm mb-1">Selamat Datang</Text>
            <Text className="text-2xl font-bold text-slate-900">Halo, {user?.nama_lengkap?.split(' ')[0] || 'Admin'}</Text>
          </View>
          {/* <TouchableOpacity className="relative p-2">
            <Bell size={24} color="#334155" />
            <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </TouchableOpacity> */}
        </View>

        {/* Card Statistik */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-slate-900">Statistik Hari Ini</Text>
          <Text className="text-slate-400 text-sm">{todayStr}</Text>
        </View>
        
        <View className="bg-blue-600 rounded-3xl p-6 mb-8 shadow-lg shadow-blue-200 flex-row">
          <View className="flex-1 border-r border-blue-500 border-opacity-50 pr-4">
            <View className="flex-row items-center mb-2">
              <Package size={20} color="white" className="mr-2" />
              <Text className="text-blue-100 font-medium">Paket Masuk</Text>
            </View>
            <Text className="text-white text-4xl font-bold mb-2 mt-1">
              {loading ? '-' : stats.masuk_hari_ini}
            </Text>
            <Text className="text-blue-200 text-xs text-opacity-80">Catatan per hari ini</Text>
          </View>
          
          <View className="flex-1 pl-6">
            <View className="flex-row items-center mb-2">
              <CheckCircle size={20} color="white" className="mr-2" />
              <Text className="text-blue-100 font-medium">Diambil</Text>
            </View>
            <Text className="text-white text-4xl font-bold mb-2 mt-1">
              {loading ? '-' : stats.sudah_diambil}
            </Text>
            <Text className="text-blue-200 text-xs text-opacity-80">{completionRate}% Selesai</Text>
          </View>
        </View>

        {/* Paket Terbaru */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-slate-900">Paket Terbaru</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/riwayat')}>
            <Text className="text-blue-600 font-medium text-sm">Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {/* List Items */}
        <View className="space-y-4 mb-24">
          {loading ? (
            <ActivityIndicator size="large" color="#1d4ed8" className="mt-8" />
          ) : recentPackages.length === 0 ? (
            <Text className="text-slate-400 text-center py-8">Belum ada paket terbaru</Text>
          ) : (
            recentPackages.map((pkg: any) => (
              <TouchableOpacity 
                key={pkg.id}
                onLongPress={() => confirmAmbil(pkg)}
                onPress={() => router.push({ pathname: '/paket/[id]', params: { id: pkg.id } })}
                className="bg-white p-4 rounded-2xl flex-row items-center shadow-sm shadow-slate-200 border border-slate-100 mb-3"
              >
                <View className="w-12 h-12 bg-blue-50 rounded-xl items-center justify-center mr-4 overflow-hidden">
                  {pkg.pegawai?.foto_url ? (
                    <Image source={{ uri: pkg.pegawai.foto_url }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    getPackageIcon(pkg.nama_ekspedisi)
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-bold mb-1" numberOfLines={1}>
                    {pkg.pegawai?.nama || `PKG-${String(pkg.id).padStart(5, '0')}`}
                  </Text>
                  <Text className="text-slate-500 text-xs">
                    {pkg.nama_ekspedisi || 'Tanpa Ekspedisi'} - {new Date(pkg.waktu_diterima).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                </View>
                <View className={`px-3 py-1.5 rounded-full ${pkg.status === 'sudah_diambil' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <Text className={`text-xs font-medium ${pkg.status === 'sudah_diambil' ? 'text-green-700' : 'text-yellow-700'}`}>
                    {pkg.status === 'sudah_diambil' ? 'Diambil' : 'Menunggu'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handleTambahPaket}
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center p-0 shadow-lg shadow-blue-600"
        style={{ elevation: 5 }}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
