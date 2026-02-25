import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package } from 'lucide-react-native';
import { useAuth, getSecureItem } from '@/lib/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { token, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Wait 2 seconds before navigating
    const timer = setTimeout(async () => {
      if (token) {
        router.replace('/(tabs)');
      } else {
        const onboardingShown = await getSecureItem('bps_onboarding_shown');
        if (onboardingShown === 'true') {
          router.replace('/(auth)/login');
        } else {
          router.replace('/onboarding');
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [router, loading, token]);

  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <View className="items-center justify-center flex-1">
        <View className="w-32 h-32 bg-blue-100 rounded-3xl items-center justify-center mb-8">
          <Package size={64} color="#1d4ed8" />
        </View>
        
        <Text className="text-4xl font-bold text-gray-900 mb-2">BPS Paket</Text>
        <Text className="text-gray-500 mb-10 text-center text-lg max-w-[250px]">
          Sistem Pendataan & Notifikasi Paket BPS
        </Text>

        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
      
      <View className="pb-8">
        <Text className="text-gray-400 text-sm font-medium">Powered by BPS IT</Text>
      </View>
    </SafeAreaView>
  );
}
