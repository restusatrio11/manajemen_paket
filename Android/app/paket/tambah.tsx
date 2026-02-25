import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, Modal, FlatList, Platform, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Search, CheckCircle2, MessageSquare, Truck, AppWindow, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '@/lib/api';

export default function TambahPaketScreen() {
  const router = useRouter();

  // Master Data
  const [ekspedisiList, setEkspedisiList] = useState<any[]>([]);
  const [platformList, setPlatformList] = useState<any[]>([]);
  const [pegawaiList, setPegawaiList] = useState<any[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  // Form State
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedEkspedisi, setSelectedEkspedisi] = useState<any>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
  const [selectedPegawai, setSelectedPegawai] = useState<any>(null);
  const [pesan, setPesan] = useState('');
  
  // Search & Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalType, setModalType] = useState<'ekspedisi' | 'platform' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch Master Data
    Promise.all([
      api.get('/master/ekspedisi'),
      api.get('/master/platform')
    ]).then(([eksRes, platRes]) => {
      if (eksRes.data.success) {
        setEkspedisiList(eksRes.data.data);
        if (eksRes.data.data.length > 0) setSelectedEkspedisi(eksRes.data.data[0]);
      }
      if (platRes.data.success) {
        setPlatformList(platRes.data.data);
        if (platRes.data.data.length > 0) setSelectedPlatform(platRes.data.data[0]);
      }
      setLoadingMaster(false);
    }).catch((err) => {
      console.error(err);
      setLoadingMaster(false);
    });
  }, []);

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

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPegawai) {
      Alert.alert('Gagal', 'Mohon pilih pengerima paket (pegawai) terlebih dahulu.');
      return;
    }

    if (!imageUri) {
      Alert.alert('Gagal', 'Harap lengkapi foto resi atau bukti paket.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload file first
      let fotoUrl = null;
      if (imageUri) {
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        if (Platform.OS === 'web') {
           const response = await fetch(imageUri);
           const blob = await response.blob();
           formData.append('file', blob, filename);
        } else {
           formData.append('file', {
             uri: imageUri,
             name: filename,
             type
           } as any);
        }

        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        fotoUrl = uploadRes.data.data?.url;
      }

      // 2. Submit Package Data
      const payload = {
        nip_pegawai: selectedPegawai.nip,
        ekspedisi_id: selectedEkspedisi?.id,
        platform_id: selectedPlatform?.id,
        foto_paket_url: fotoUrl
      };

      const res = await api.post('/paket', payload);

      if (res.data.success) {
         if (Platform.OS === 'android') {
           ToastAndroid.show('Paket berhasil dicatat & WA diproses!', ToastAndroid.LONG);
           router.replace('/(tabs)');
         } else if (Platform.OS === 'web') {
           window.alert('Sukses: Paket berhasil dicatat dan notifikasi WA sedang diproses!');
           router.replace('/(tabs)');
         } else {
           Alert.alert('Sukses', 'Paket berhasil dicatat dan notifikasi WA sedang diproses!', [
             { text: 'OK', onPress: () => router.replace('/(tabs)') }
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

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <SelectModal />
      
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-slate-50">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-xl font-bold text-slate-900 mr-6">
          Log Paket Masuk
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Placeholder Foto Paket */}
        <TouchableOpacity 
          onPress={pickImage}
          className="w-full h-64 bg-orange-200 rounded-3xl mb-6 relative overflow-hidden items-center justify-center border-2 border-dashed border-orange-400"
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="items-center">
              <Camera size={48} color="#ea580c" className="mb-2 opacity-50" />
              <Text className="text-orange-800 font-bold opacity-60 text-lg">AMBIL FOTO PAKET</Text>
            </View>
          )}
          {imageUri && (
            <View className="absolute top-4 right-4 bg-black/60 px-3 py-1.5 rounded-full flex-row items-center">
              <Camera size={14} color="white" className="mr-1.5" />
              <Text className="text-white text-xs font-medium">Ubah Foto</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Ekspedisi & Platform */}
        {loadingMaster ? (
          <ActivityIndicator size="small" color="#1d4ed8" className="mb-6" />
        ) : (
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
        )}

        {/* Cari Penerima */}
        <Text className="text-slate-900 font-bold mb-3">Cari Penerima</Text>
        <View className="bg-white border border-slate-200 rounded-full px-4 h-14 flex-row items-center mb-4 shadow-sm shadow-slate-100">
          <Search size={20} color="#94a3b8" className="mr-3" />
          <TextInput
            placeholder="Cari Nama Pegawai (Min 2 huruf)..."
            placeholderTextColor="#94a3b8"
            className="flex-1 text-slate-800 text-base"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
               <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* List Hasil Pencarian / Sering Dicari */}
        <View className="space-y-3 mb-6">
          {pegawaiList.map((user) => (
            <TouchableOpacity
              key={user.nip}
              onPress={() => setSelectedPegawai(user)}
              className={`p-4 rounded-2xl flex-row items-center border ${
                selectedPegawai?.nip === user.nip 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-white border-slate-100 shadow-sm shadow-slate-100'
              }`}
            >
              <View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-slate-100 relative overflow-hidden">
                {user.foto ? (
                  <Image source={{uri: user.foto}} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-slate-500 font-bold text-lg">{user.nama.substring(0,2).toUpperCase()}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 font-bold text-base mb-0.5" numberOfLines={1}>{user.nama}</Text>
                <Text className="text-slate-500 text-xs font-mono">{user.nip}</Text>
              </View>
              {selectedPegawai?.nip === user.nip && (
                <CheckCircle2 color="#16a34a" size={24} />
              )}
            </TouchableOpacity>
          ))}
          {searchQuery.length > 0 && pegawaiList.length === 0 && (
             <Text className="text-center text-slate-400 py-4">Tidak ada pegawai ditemukan</Text>
          )}
        </View>

      </ScrollView>

      {/* Button Kirim WA */}
      <View className="p-6 bg-slate-50 border-t border-slate-200 pb-8">
        <TouchableOpacity
          disabled={submitting || !selectedPegawai}
          onPress={handleSubmit}
          className={`w-full py-4 rounded-xl flex-row justify-center items-center shadow-lg ${
            submitting || !selectedPegawai ? 'bg-slate-300 shadow-slate-200' : 'bg-green-500 shadow-green-200'
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="white" className="mr-2" />
          ) : (
            <MessageSquare size={20} color="white" className="mr-2" />
          )}
          <Text className="text-white font-bold text-lg">
             {submitting ? 'Menyimpan...' : 'Kirim Notif WA'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
