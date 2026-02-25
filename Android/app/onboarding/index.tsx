import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, Search, MessageSquare, Send } from 'lucide-react-native';
import { saveSecureItem } from '@/lib/AuthContext';

const SLIDES = [
  {
    title: '1. Foto Paket',
    description: 'Jepret foto resi atau paket yang baru datang untuk pendataan digital.',
    Icon: Camera,
  },
  {
    title: '2. Cari Penerima',
    description: 'Cari nama pegawai yang akan menerima paket dengan cepat melalui daftar yang tersedia.',
    Icon: Search,
  },
  {
    title: '3. Beri Pesan Tambahan',
    description: 'Tambahkan catatan seperti lokasi paket atau instruksi khusus untuk penerima.',
    Icon: MessageSquare,
  },
  {
    title: '4. Kirim Notifikasi',
    description: 'Kirim notifikasi WhatsApp secara instan agar penerima segera mengambil paketnya.',
    Icon: Send,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const handleNext = async () => {
    if (currentPage < SLIDES.length - 1) {
      const nextPage = currentPage + 1;
      scrollRef.current?.scrollTo({ x: nextPage * width, animated: true });
      setCurrentPage(nextPage);
    } else {
      await saveSecureItem('bps_onboarding_shown', 'true');
      router.replace('/(tabs)');
    }
  };

  const skip = async () => {
    await saveSecureItem('bps_onboarding_shown', 'true');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header - Tombol Lewati */}
      <View className="px-6 py-4 flex-row justify-end">
        <TouchableOpacity onPress={skip} className="p-2">
          <Text className="text-blue-600 font-medium">Lewati</Text>
        </TouchableOpacity>
      </View>

      {/* Konten Swiper Menggunakan ScrollView */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const pageIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentPage(pageIndex);
        }}
        className="flex-1"
      >
        {SLIDES.map((slide, index) => {
          const { Icon } = slide;
          return (
            <View key={index} style={{ width }} className="flex-1 items-center px-6">
              <View className="flex-1 justify-center items-center w-full">
                {/* Ilustrasi Placeholder */}
                <View className="w-64 h-64 bg-slate-100 rounded-3xl items-center justify-center mb-8">
                  <Icon size={100} color="#3b82f6" />
                </View>
                
                <Text className="text-2xl font-bold text-slate-900 text-center mb-4">
                  {slide.title}
                </Text>
                
                <Text className="text-slate-500 text-center text-base leading-relaxed px-4">
                  {slide.description}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Footer Navigasi */}
      <View className="px-6 pb-10 pt-4 items-center w-full">
        {/* Indikator Halaman (Dots) */}
        <View className="flex-row space-x-2 mb-8 items-center h-4 justify-center">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full mx-1 ${
                i === currentPage ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </View>

        {/* Tombol Selanjutnya / Mulai */}
        <TouchableOpacity
          onPress={handleNext}
          className="w-full bg-blue-600 py-4 rounded-full items-center shadow-lg shadow-blue-200 flex-row justify-center"
        >
          <Text className="text-white font-semibold text-lg text-center">
            {currentPage === SLIDES.length - 1 ? 'Mulai Sekarang 🚀' : 'Selanjutnya →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
