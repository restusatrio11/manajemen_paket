import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, Alert, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, BarChart2, Clock, Archive, Download } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from '@/lib/api';

const PERIODS = ['Minggu Ini', 'Bulan Ini', '3 Bulan Terakhir'];

export default function LaporanScreen() {
  const [activePeriod, setActivePeriod] = useState('Bulan Ini');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>({
    total: 0,
    sudah_diambil: 0,
    menunggu_diambil: 0,
    masuk_hari_ini: 0
  });

  const fetchData = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const res = await api.get(`/paket/stats?month=${currentMonth}&year=${currentYear}`);
      if (res.data.success) {
         setStats(res.data.data);
      }
    } catch (error) {
      console.error('Failed fetching stats', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [activePeriod]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [activePeriod]);

  // Calculate percentage taken vs waiting
  const percentageTaken = stats.total > 0 ? Math.round((stats.sudah_diambil / stats.total) * 100) : 0;

  const [downloading, setDownloading] = useState(false);

  const handleDownloadCSV = async () => {
    try {
      setDownloading(true);
      
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      if (Platform.OS === 'web') {
        // Direct browser download
        const url = `${api.defaults.baseURL}/paket/export?month=${currentMonth}&year=${currentYear}`;
        window.open(url, '_blank');
        return;
      }
      
      // For Android/iOS
      const res = await api.get(`/paket/export?month=${currentMonth}&year=${currentYear}`, { responseType: 'text' });
      const csvString = res.data;

      const filename = `Laporan_Paket_${currentMonth}_${currentYear}.csv`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Simpan Laporan CSV' });
      } else {
        if (Platform.OS === 'android') {
          ToastAndroid.show('File disimpan di direktori dokumen.', ToastAndroid.LONG);
        } else {
           Alert.alert('Sukses', 'File CSV berhasil dibuat.');
        }
      }
    } catch (e: any) {
       console.error('Error downloading CSV', e);
       if (Platform.OS === 'android') {
         ToastAndroid.show('Gagal mengunduh CSV', ToastAndroid.SHORT);
       } else {
         Alert.alert('Gagal', 'Terjadi kesalahan saat mengunduh CSV');
       }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
        <Text className="text-xl font-bold text-slate-900">Laporan Statistik</Text>
        <TouchableOpacity className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-lg">
          <Calendar size={14} color="#1d4ed8" className="mr-1.5" />
          <Text className="text-blue-700 font-semibold text-sm">
            {new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-4 space-y-4" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1d4ed8']} />}
      >
        {/* Toggle Period */}
        <View className="flex-row justify-between mb-2 mt-2">
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setActivePeriod(period)}
              className={`flex-1 py-2 px-2 items-center rounded-full mx-1 ${
                activePeriod === period ? 'bg-blue-600' : 'bg-white'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activePeriod === period ? 'text-white' : 'text-slate-500'
                }`}
                numberOfLines={1}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
             <ActivityIndicator size="large" color="#1d4ed8" className="mt-10" />
        ) : (
          <>
            {/* Volume Paket Masuk */}
            <View className="bg-white p-6 rounded-3xl shadow-sm shadow-slate-200 border border-slate-100">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-slate-500 font-medium">Volume Paket Masuk</Text>
                <Text className="text-slate-400 font-bold tracking-widest">...</Text>
              </View>
              <View className="flex-row items-center mb-10">
                <Text className="text-3xl font-bold text-slate-900 mr-3">{stats.total}</Text>
                <View className="bg-green-100 px-2 py-1 rounded-full">
                  <Text className="text-green-700 text-xs font-bold">Total</Text>
                </View>
              </View>

              {/* Simple Mock Chart Area */}
              <View className="flex-row justify-between items-end h-24 mb-4">
                <View className="w-8 h-12 bg-blue-100 rounded-lg" />
                <View className="w-8 h-16 bg-blue-100 rounded-lg" />
                <View className="w-8 h-24 bg-blue-600 rounded-lg" />
                <View className="w-8 h-10 bg-blue-100 rounded-lg" />
                <View className="w-8 h-14 bg-blue-100 rounded-lg" />
                <View className="w-8 h-6 bg-blue-100 rounded-lg" />
                <View className="w-8 h-8 bg-blue-100 rounded-lg" />
              </View>

              {/* X Axis labels */}
              <View className="flex-row justify-between px-1">
                {['Sn','Sl','Rb','Km','Jm','Sb','Mg'].map((day) => (
                  <Text key={day} className="text-slate-400 text-xs font-medium">{day}</Text>
                ))}
              </View>
            </View>

            {/* Status Pengambilan */}
            <View className="bg-white p-6 rounded-3xl shadow-sm shadow-slate-200 border border-slate-100">
              <Text className="text-slate-500 font-medium mb-6">Status Pengambilan</Text>
              <View className="flex-row items-center">
                <View className="items-center mr-8">
                  <Text className="text-3xl font-bold text-blue-600 mb-1">{percentageTaken}%</Text>
                  <Text className="text-slate-400 text-xs font-bold tracking-widest">TERAMBIL</Text>
                </View>
                <View className="flex-1 space-y-3">
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-blue-600 mr-3" />
                    <View>
                      <Text className="text-slate-900 font-bold text-sm">Sudah Diambil</Text>
                      <Text className="text-slate-500 text-xs">{stats.sudah_diambil} Paket</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-slate-200 mr-3" />
                    <View>
                      <Text className="text-slate-900 font-bold text-sm">Belum Diambil</Text>
                      <Text className="text-slate-500 text-xs">{stats.menunggu_diambil} Paket</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Ringkasan Laporan */}
            <View>
              <Text className="text-slate-500 font-medium mb-4 mt-2 px-2">Ringkasan Laporan</Text>
              
              <View className="bg-slate-50 p-4 rounded-2xl flex-row items-center border border-slate-100 mb-3">
                <View className="w-12 h-12 bg-blue-100 rounded-xl items-center justify-center mr-4">
                  <BarChart2 size={24} color="#2563eb" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-500 text-xs mb-1">Paket Masuk Hari Ini</Text>
                  <Text className="text-slate-900 font-bold text-lg">{stats.masuk_hari_ini} Paket</Text>
                </View>
              </View>

              <View className="bg-slate-50 p-4 rounded-2xl flex-row items-center border border-slate-100 mb-6">
                <View className="w-12 h-12 bg-orange-100 rounded-xl items-center justify-center mr-4">
                  <Clock size={24} color="#ea580c" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-500 text-xs mb-1">Status Selesai</Text>
                  <Text className="text-slate-900 font-bold text-lg">{percentageTaken}%</Text>
                </View>
              </View>

              <TouchableOpacity 
                disabled={downloading}
                onPress={handleDownloadCSV}
                className={`bg-blue-600 rounded-2xl py-4 flex-row justify-center items-center shadow-md shadow-blue-200 mb-2 mt-2 ${downloading ? 'opacity-70' : ''}`}
               >
                {downloading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Download size={20} color="white" className="mr-2" />
                    <Text className="text-white font-bold text-base">Unduh Laporan CSV</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text className="text-center text-slate-400 text-xs mb-12">Laporan akan diunduh langsung ke file berformat CSV (.csv).</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
