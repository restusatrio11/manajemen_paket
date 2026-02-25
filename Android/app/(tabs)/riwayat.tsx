import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, ToastAndroid, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, CheckCircle2, AlertCircle, Clock, Package } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '@/lib/api';

const FILTERS = ['Semua', 'Diambil', 'Menunggu']; // Adjust according to API status

export default function RiwayatScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [packages, setPackages] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    sudah_diambil: 0,
    menunggu_diambil: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // 1. Fetch Stats for current month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const statsRes = await api.get(`/paket/stats?month=${currentMonth}&year=${currentYear}`);
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      // 2. Fetch History Packages
      // Mapping filter string to API query param
      let statusParam = '';
      if (activeFilter === 'Diambil') statusParam = 'sudah_diambil';
      else if (activeFilter === 'Menunggu') statusParam = 'menunggu_diambil';

      const pkgsRes = await api.get(`/paket?limit=50&status=${statusParam}`);
      if (pkgsRes.data.success) {
        setPackages(pkgsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [activeFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [activeFilter]);

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
        'Konfirmasi',
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

  // Group packages by Month and Year
  const groupedPackages = packages.reduce((groups: any, pkg: any) => {
    const date = new Date(pkg.waktu_diterima);
    const monthYear = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(pkg);
    return groups;
  }, {});

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-center py-4 border-b border-slate-100 mb-4">
        <Text className="text-xl font-bold text-slate-800">Riwayat Paket</Text>
      </View>

      <ScrollView 
        className="flex-1 px-6" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1d4ed8']} />}
      >
        {/* Rekap Card */}
        <View className="bg-blue-600 rounded-3xl p-6 mb-6 shadow-lg shadow-blue-200 relative overflow-hidden">
          <View className="absolute right-6 top-6 w-10 h-10 bg-blue-500 rounded-full items-center justify-center opacity-80 z-10">
            <BarChart color="white" size={20} />
          </View>
          
          <Text className="text-blue-100 text-sm mb-1">Rekap Bulan Ini</Text>
          <Text className="text-white text-4xl font-bold mb-6">{stats.total} Paket</Text>
          
          <View className="flex-row justify-between">
            <View className="bg-blue-500 bg-opacity-40 rounded-2xl flex-1 mr-2 p-3">
              <View className="flex-row items-center mb-1">
                <CheckCircle2 color="white" size={14} className="mr-1" />
                <Text className="text-blue-100 text-xs">Diambil</Text>
              </View>
              <Text className="text-white font-bold text-xl">{stats.sudah_diambil}</Text>
            </View>
            
            <View className="bg-blue-500 bg-opacity-40 rounded-2xl flex-1 ml-2 p-3">
              <View className="flex-row items-center mb-1">
                <Clock color="white" size={14} className="mr-1" />
                <Text className="text-blue-100 text-xs">Menunggu</Text>
              </View>
              <Text className="text-white font-bold text-xl">{stats.menunggu_diambil}</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 flex-row max-h-12 border-b-transparent">
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`px-5 py-2 rounded-full mr-3 border border-slate-200 ${
                activeFilter === filter ? 'bg-slate-900 border-slate-900' : 'bg-white'
              }`}
              style={{ alignSelf: 'flex-start' }}
            >
              <Text
                className={`text-sm font-medium ${
                  activeFilter === filter ? 'text-white' : 'text-slate-600'
                }`}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading Indicator */}
        {loading ? (
           <ActivityIndicator size="large" color="#1d4ed8" className="mt-10" />
        ) : Object.keys(groupedPackages).length === 0 ? (
          <View className="items-center justify-center py-10 opacity-50">
            <Package size={48} color="#94a3b8" className="mb-4" />
            <Text className="text-slate-500 text-center">Belum ada riwayat paket untuk filter ini.</Text>
          </View>
        ) : (
          /* Render grouped list */
          Object.keys(groupedPackages).map((monthYear, idx) => (
            <View key={monthYear} className={`${idx === Object.keys(groupedPackages).length - 1 ? 'mb-10' : ''}`}>
              <Text className="text-slate-500 font-bold text-xs tracking-wider mb-4 uppercase">
                {monthYear}
              </Text>

              <View className="space-y-4 mb-8">
                {groupedPackages[monthYear].map((pkg: any) => (
                  <TouchableOpacity 
                    key={pkg.id} 
                    onLongPress={() => confirmAmbil(pkg)}
                    onPress={() => router.push({ pathname: '/paket/[id]', params: { id: pkg.id } })}
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100 flex-row items-center mb-3"
                  >
                    <View className="mr-4 relative">
                      <View className={`w-12 h-12 rounded-full items-center justify-center overflow-hidden ${pkg.status === 'sudah_diambil' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                        {pkg.pegawai?.foto_url ? (
                          <Image source={{ uri: pkg.pegawai.foto_url }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                          <Text className={`font-bold ${pkg.status === 'sudah_diambil' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {pkg.pegawai?.nama ? pkg.pegawai.nama.substring(0,2).toUpperCase() : 'PK'}
                          </Text>
                        )}
                      </View>
                      <View className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                        {pkg.status === 'sudah_diambil' ? (
                          <CheckCircle2 size={16} color="#16a34a" />
                        ) : (
                          <Clock size={16} color="#eab308" />
                        )}
                      </View>
                    </View>
                    
                    <View className="flex-1">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-slate-900 font-bold text-base line-clamp-1 flex-1 mr-2" numberOfLines={1}>
                          {pkg.pegawai?.nama || `PKG-${String(pkg.id).padStart(5, '0')}`}
                        </Text>
                        <Text className="text-slate-400 text-xs">
                           {new Date(pkg.waktu_diterima).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                        </Text>
                      </View>
                      <Text className="text-slate-500 text-sm mb-1">{pkg.nama_ekspedisi || 'Tanpa Ekspedisi'}</Text>
                      <View className="flex-row items-center">
                        {pkg.status === 'sudah_diambil' ? (
                          <>
                            <CheckCircle2 size={12} color="#16a34a" className="mr-1" />
                            <Text className="text-green-600 text-xs">Sudah Diambil</Text>
                          </>
                        ) : (
                          <>
                             <Clock size={12} color="#eab308" className="mr-1" />
                             <Text className="text-yellow-600 text-xs">Menunggu Diambil</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
