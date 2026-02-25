import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, ToastAndroid, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, Package, Truck, AppWindow, Clock, Image as ImageIcon, Trash2, Edit2 } from 'lucide-react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import api from '@/lib/api';

export default function DetailPaketScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/paket/${id}`);
      if (res.data.success) {
        setDetail(res.data.data);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Gagal', 'Tidak dapat mengambil detail paket');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [id])
  );

  const processAmbil = async () => {
    setSubmitting(true);
    try {
      const res = await api.put(`/paket/${id}/ambil`, {});
      if (res.data.success) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Status paket: Diambil!', ToastAndroid.SHORT);
        } else if (Platform.OS === 'web') {
          window.alert('Sukses: Status paket berhasil diperbarui!');
        } else {
          Alert.alert('Sukses', 'Status paket berhasil diperbarui!');
        }
        router.replace('/(tabs)'); // Kembali ke halaman utama
      }
    } catch(e: any) {
      if (Platform.OS === 'web') {
         window.alert('Gagal: ' + (e.response?.data?.message || 'Gagal mengubah status paket'));
      } else {
         Alert.alert('Gagal', e.response?.data?.message || 'Gagal mengubah status paket');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAmbil = async () => {
    if (Platform.OS === 'web') {
      const konfirm = window.confirm('Tandai paket ini sudah diambil oleh penerima?');
      if (konfirm) {
        processAmbil();
      }
    } else {
      Alert.alert(
        'Konfirmasi',
        'Tandai paket ini sudah diambil oleh penerima?',
        [
          { text: 'Batal', style: 'cancel' },
          { 
            text: 'Ya, Diambil', 
            onPress: processAmbil
          }
        ]
      );
    }
  };

  const processDelete = async () => {
    setSubmitting(true);
    try {
      const res = await api.delete(`/paket/${id}`);
      if (res.data.success) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Paket berhasil dihapus', ToastAndroid.SHORT);
        } else if (Platform.OS === 'web') {
          window.alert('Sukses: Paket berhasil dihapus');
        } else {
          Alert.alert('Sukses', 'Paket berhasil dihapus');
        }
        router.replace('/(tabs)');
      }
    } catch(e: any) {
      if (Platform.OS === 'web') {
         window.alert('Gagal: ' + (e.response?.data?.message || 'Gagal menghapus paket'));
      } else {
         Alert.alert('Gagal', e.response?.data?.message || 'Gagal menghapus paket');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (Platform.OS === 'web') {
      const konfirm = window.confirm('Apakah Anda yakin ingin menghapus paket ini?');
      if (konfirm) {
        processDelete();
      }
    } else {
      Alert.alert(
        'Konfirmasi Hapus',
        'Apakah Anda yakin ingin menghapus paket ini?',
        [
          { text: 'Batal', style: 'cancel' },
          { 
            text: 'Ya, Hapus', 
            style: 'destructive',
            onPress: processDelete
          }
        ]
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text className="text-slate-500 mt-4">Memuat detail paket...</Text>
      </SafeAreaView>
    );
  }

  if (!detail) return null;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-slate-50 border-b border-slate-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-xl font-bold text-slate-900 mr-6">
          Detail Paket
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View className="items-center mb-6">
          <View className={`px-4 py-1.5 rounded-full flex-row items-center ${detail.status === 'sudah_diambil' ? 'bg-green-100' : 'bg-yellow-100'}`}>
            {detail.status === 'sudah_diambil' ? (
               <CheckCircle2 size={16} color="#16a34a" className="mr-1.5" />
            ) : (
               <Clock size={16} color="#eab308" className="mr-1.5" />
            )}
            <Text className={`font-bold ${detail.status === 'sudah_diambil' ? 'text-green-700' : 'text-yellow-700'}`}>
              {detail.status === 'sudah_diambil' ? 'Sudah Diambil' : 'Menunggu Diambil'}
            </Text>
          </View>
          <Text className="text-slate-400 font-mono mt-2">PKG-{String(detail.id).padStart(6, '0')}</Text>
        </View>

        {/* Photo Card */}
        <View className="bg-white rounded-3xl overflow-hidden shadow-sm shadow-slate-200 border border-slate-100 mb-6">
          {detail.foto_paket_url ? (
            <Image 
              source={{ uri: `http://10.12.12.109:3000${detail.foto_paket_url.replace('/public', '')}` }} 
              className="w-full h-64 bg-slate-100" 
              resizeMode="cover" 
            />
          ) : (
            <View className="w-full h-48 bg-slate-100 items-center justify-center">
              <ImageIcon size={48} color="#cbd5e1" className="mb-2" />
              <Text className="text-slate-400 font-medium">Tidak ada foto resi</Text>
            </View>
          )}
        </View>

        {/* Info Detail */}
        <View className="bg-white p-5 rounded-3xl shadow-sm shadow-slate-200 border border-slate-100 mb-8 space-y-5">
          {/* Pegawai/Penerima */}
          <View>
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tujuan Penerima</Text>
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3 overflow-hidden">
                {detail.pegawai?.foto_url ? (
                  <Image source={{ uri: detail.pegawai.foto_url }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-blue-600 font-bold">{detail.nip_pegawai.substring(0, 2)}</Text>
                )}
              </View>
              <View>
                <Text className="text-slate-900 font-bold text-base">{detail.pegawai?.nama || 'Tanpa Nama'}</Text>
                <Text className="text-slate-500 text-xs">NIP: {detail.nip_pegawai}</Text>
              </View>
            </View>
          </View>

          <View className="flex-row space-x-4">
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ekspedisi</Text>
              <View className="flex-row items-center">
                <Truck size={16} color="#64748b" className="mr-2" />
                <Text className="text-slate-800 font-medium">{detail.nama_ekspedisi || '-'}</Text>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Platform</Text>
              <View className="flex-row items-center">
                <AppWindow size={16} color="#64748b" className="mr-2" />
                <Text className="text-slate-800 font-medium">{detail.nama_platform || '-'}</Text>
              </View>
            </View>
          </View>

          <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-500 text-xs">Waktu Diterima:</Text>
              <Text className="text-slate-800 text-xs font-bold">
                {new Date(detail.waktu_diterima).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
              </Text>
            </View>
            {detail.status === 'sudah_diambil' && (
              <View className="flex-row justify-between">
                <Text className="text-green-600 text-xs">Waktu Diambil:</Text>
                <Text className="text-green-600 text-xs font-bold">
                  {detail.waktu_diambil ? new Date(detail.waktu_diambil).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between mt-2 pt-2 border-t border-slate-200">
              <Text className="text-slate-500 text-xs">Dicatat Oleh:</Text>
              <Text className="text-slate-800 text-xs font-medium">{detail.nama_petugas || 'Resepsionis'}</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Ambil Button */}
      {detail.status === 'menunggu_diambil' && (
        <View className="p-6 bg-white border-t border-slate-100 pb-8">
          <TouchableOpacity
            disabled={submitting}
            onPress={handleAmbil}
            className={`w-full py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-green-200 bg-green-500 mb-3 ${submitting ? 'opacity-70' : ''}`}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <CheckCircle2 color="white" size={20} className="mr-2" />
                <Text className="text-white font-bold text-lg">Tandai Sudah Diambil</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={submitting}
            onPress={() => router.push(`/paket/edit/${id}`)}
            className={`w-full py-3 rounded-2xl flex-row justify-center items-center border border-orange-200 bg-orange-50 mb-3 ${submitting ? 'opacity-70' : ''}`}
          >
            <Edit2 color="#f97316" size={18} className="mr-2" />
            <Text className="text-orange-500 font-bold text-base">Edit Detail Paket</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={submitting}
            onPress={handleDelete}
            className={`w-full py-3 rounded-2xl flex-row justify-center items-center border border-red-200 bg-red-50 ${submitting ? 'opacity-70' : ''}`}
          >
            <Trash2 color="#ef4444" size={18} className="mr-2" />
            <Text className="text-red-500 font-bold text-base">Hapus Paket</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
