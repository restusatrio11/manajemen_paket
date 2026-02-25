import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, FlatList, Platform, ToastAndroid, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, CheckCircle2, Truck, AppWindow, X, Save } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/lib/api';

export default function EditPaketScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Initialization State
  const [initLoading, setInitLoading] = useState(true);

  // Master Data
  const [ekspedisiList, setEkspedisiList] = useState<any[]>([]);
  const [platformList, setPlatformList] = useState<any[]>([]);
  const [pegawaiList, setPegawaiList] = useState<any[]>([]);

  // Form State
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [selectedEkspedisi, setSelectedEkspedisi] = useState<any>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
  const [selectedPegawai, setSelectedPegawai] = useState<any>(null);
  
  // Search & Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalType, setModalType] = useState<'ekspedisi' | 'platform' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch Master Data and Current Detail
    Promise.all([
      api.get('/master/ekspedisi'),
      api.get('/master/platform'),
      api.get(`/paket/${id}`)
    ]).then(([eksRes, platRes, detailRes]) => {
      let eksData: any[] = [];
      let platData: any[] = [];

      if (eksRes.data.success) {
        eksData = eksRes.data.data;
        setEkspedisiList(eksData);
      }
      if (platRes.data.success) {
        platData = platRes.data.data;
        setPlatformList(platData);
      }

      if (detailRes.data.success) {
         const detail = detailRes.data.data;
         setFotoUrl(detail.foto_paket_url);
         setSelectedEkspedisi(eksData.find(e => e.id === detail.ekspedisi_id) || null);
         setSelectedPlatform(platData.find(p => p.id === detail.platform_id) || null);
         
         // Mock pegawai selection from detail
         if (detail.pegawai && detail.nip_pegawai) {
             const preselect = { ...detail.pegawai, nip: detail.nip_pegawai };
             setSelectedPegawai(preselect);
             setPegawaiList([preselect]);
         }
      }

      setInitLoading(false);
    }).catch((err) => {
      console.error(err);
      setInitLoading(false);
      Alert.alert('Gagal', 'Terjadi kesalahan saat memuat data');
      router.back();
    });
  }, [id]);

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Pegawai based on Search
  useEffect(() => {
    if (debouncedSearch.length < 2) return;
    
    api.get(`/master/pegawai?q=${debouncedSearch}`)
      .then(res => {
        if (res.data.success) {
          setPegawaiList(res.data.data);
        }
      })
      .catch(console.error);
  }, [debouncedSearch]);

  const handleSubmit = async () => {
    if (!selectedPegawai) {
      Alert.alert('Gagal', 'Mohon pilih pengerima paket (pegawai) terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nip_pegawai: selectedPegawai.nip,
        ekspedisi_id: selectedEkspedisi?.id,
        platform_id: selectedPlatform?.id,
      };

      const res = await api.put(`/paket/${id}`, payload);

      if (res.data.success) {
         if (Platform.OS === 'android') {
           ToastAndroid.show('Detail paket berhasil diperbarui', ToastAndroid.SHORT);
           router.back(); // Kembalikan ke halaman detail
         } else if (Platform.OS === 'web') {
           window.alert('Sukses: Detail paket berhasil diperbarui');
           router.back();
         } else {
           Alert.alert('Sukses', 'Detail paket berhasil diperbarui', [
             { text: 'OK', onPress: () => router.back() }
           ]);
         }
      }
    } catch (error: any) {
      Alert.alert('Gagal', error.response?.data?.message || 'Gagal menyimpan data paket.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Render Modal for Selection
  const SelectModal = () => (
    <Modal visible={!!modalType} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl h-1/2 p-6">
          <View className="flex-row justify-between mb-4">
            <Text className="text-xl font-bold">Pilih {modalType === 'ekspedisi' ? 'Ekspedisi' : 'Platform'}</Text>
            <TouchableOpacity onPress={() => setModalType(null)}>
              <X color="#64748b" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={modalType === 'ekspedisi' ? ekspedisiList : platformList}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  if (modalType === 'ekspedisi') setSelectedEkspedisi(item);
                  else setSelectedPlatform(item);
                  setModalType(null);
                }}
                className="py-4 border-b border-slate-100 flex-row justify-between"
              >
                <Text className="text-lg">{item.nama_ekspedisi || item.nama_platform}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text className="text-center py-4 text-slate-500">Tidak ada data</Text>}
          />
        </View>
      </View>
    </Modal>
  );

  if (initLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className="text-slate-500 mt-4">Memuat form ubah data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <SelectModal />
      
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-slate-50">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-xl font-bold text-slate-900 mr-6">
          Ubah Data Paket
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Helper Badge */}
        <View className="bg-orange-50 border border-orange-200 p-3 rounded-xl mb-6 flex-row items-center">
             <Text className="text-orange-700 text-xs flex-1 ml-1 leading-5 text-center">Formulir ini digunakan untuk mengubah Penerima, Ekspedisi, atau Platform dari paket yang sudah tercatat.</Text>
        </View>

        {/* Foto Paket Preview */}
        {fotoUrl && (
          <View className="w-full h-48 bg-slate-200 rounded-3xl mb-6 overflow-hidden border border-slate-200">
            <Image 
              source={{ uri: `http://10.12.12.109:3000${fotoUrl.replace('/public', '')}` }} 
              className="w-full h-full" 
              resizeMode="cover" 
            />
          </View>
        )}

        {/* Ekspedisi & Platform */}
        <View className="mb-6 flex-row space-x-4">
            <View className="flex-1">
                <Text className="text-slate-900 font-bold mb-2">Ekspedisi</Text>
                <TouchableOpacity 
                  onPress={() => setModalType('ekspedisi')}
                  className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex-row items-center"
                >
                  <Truck size={18} color="#64748b" className="mr-2" />
                  <Text className="text-slate-600 flex-1">{selectedEkspedisi?.nama_ekspedisi || 'Pilih...'}</Text>
                </TouchableOpacity>
            </View>
            <View className="flex-1 ml-4">
                <Text className="text-slate-900 font-bold mb-2">Platform</Text>
                <TouchableOpacity 
                  onPress={() => setModalType('platform')}
                  className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex-row items-center"
                >
                  <AppWindow size={18} color="#64748b" className="mr-2" />
                  <Text className="text-slate-600 flex-1">{selectedPlatform?.nama_platform || 'Pilih...'}</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Cari Penerima */}
        <Text className="text-slate-900 font-bold mb-3">Ubah Penerima (NIP / Nama)</Text>
        <View className={`bg-white border ${selectedPegawai ? 'border-orange-500 bg-orange-50/20' : 'border-slate-200'} rounded-full px-4 h-14 flex-row items-center mb-4 shadow-sm shadow-slate-100`}>
          <Search size={20} color={selectedPegawai ? "#ea580c" : "#94a3b8"} className="mr-3" />
          <TextInput
            placeholder={selectedPegawai ? selectedPegawai.nama : "Cari Pegawai (Min 2 huruf)..."}
            placeholderTextColor={selectedPegawai ? "#ea580c" : "#94a3b8"}
            className="flex-1 text-slate-800 text-base"
            value={searchQuery}
            onChangeText={(t) => {
               setSearchQuery(t);
               if (selectedPegawai && t !== '') {
                 setSelectedPegawai(null);
                 setPegawaiList([]);
               }
            }}
          />
          {(searchQuery.length > 0 || selectedPegawai) && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedPegawai(null); setPegawaiList([]); }}>
               <X size={18} color={selectedPegawai ? "#ea580c" : "#94a3b8"} />
            </TouchableOpacity>
          )}
        </View>

        {/* List Hasil Pencarian */}
        <View className="space-y-3 mb-6">
          {pegawaiList.map((user) => (
            <TouchableOpacity
              key={user.nip}
              onPress={() => setSelectedPegawai(user)}
              className={`p-4 rounded-2xl flex-row items-center border ${
                selectedPegawai?.nip === user.nip 
                  ? 'bg-orange-50 border-orange-200' 
                  : 'bg-white border-slate-100 shadow-sm shadow-slate-100'
              }`}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center mr-4 bg-slate-100 relative overflow-hidden">
                {user.foto || user.foto_url ? (
                  <Image source={{uri: user.foto || user.foto_url}} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-slate-500 font-bold text-sm tracking-widest">{user.nama.substring(0,2).toUpperCase()}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 font-bold text-base mb-0.5" numberOfLines={1}>{user.nama}</Text>
                <Text className="text-slate-500 text-xs font-mono">{user.nip}</Text>
              </View>
              {selectedPegawai?.nip === user.nip && (
                <CheckCircle2 color="#ea580c" size={24} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Button Simpan */}
      <View className="p-6 bg-slate-50 border-t border-slate-200 pb-8">
        <TouchableOpacity
          disabled={submitting || !selectedPegawai}
          onPress={handleSubmit}
          className={`w-full py-4 rounded-xl flex-row justify-center items-center shadow-lg ${
            submitting || !selectedPegawai ? 'bg-slate-300 shadow-slate-200' : 'bg-orange-600 shadow-orange-300'
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="white" className="mr-2" />
          ) : (
            <Save size={20} color="white" className="mr-2" />
          )}
          <Text className="text-white font-bold text-lg">
             {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
