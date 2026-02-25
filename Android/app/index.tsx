import { useEffect } from 'react';
import { View, Text, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, getSecureItem } from '@/lib/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { token, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Wait 2 seconds before navigating
    const timer = setTimeout(async () => {
      if (token) {
        const onboardingShown = await getSecureItem('bps_onboarding_shown');
        if (onboardingShown === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } else {
        router.replace('/(auth)/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [router, loading, token]);

  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <View className="items-center justify-center flex-1">
        <View className="w-32 h-32 bg-transparent rounded-3xl items-center justify-center mb-8 overflow-hidden">
          <Image source={require('../assets/images/icon.png')} className="w-full h-full" resizeMode="contain" />
        </View>
        
        <Text className="text-4xl font-bold text-gray-900 mb-2">Paket Wak</Text>
        <Text className="text-gray-500 mb-10 text-center text-lg max-w-[250px]">
          Sistem Pendataan & Notifikasi Paket Wak
        </Text>

        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
      
      <View className="pb-8">
        <Text className="text-gray-400 text-sm font-medium">Powered by BPS SUMUT IT</Text>
      </View>
    </SafeAreaView>
  );
}
