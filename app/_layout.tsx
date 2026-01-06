import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({});

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isNavigationReady) return;

    const inAuthGroup = segments[0] === 'login';

    console.log('🏠 RootLayoutNav - Auth check:', { 
      isAuthenticated, 
      inAuthGroup,
      segments
    });

    if (!isAuthenticated && !inAuthGroup) {
      console.log('🏠 RootLayoutNav - Redirecting to login');
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      console.log('🏠 RootLayoutNav - Redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isNavigationReady, router]);

  if (!isNavigationReady) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="create-order" options={{ presentation: 'modal', title: 'Create Order' }} />
      <Stack.Screen name="order/[id]" options={{ title: 'Order Details' }} />
      <Stack.Screen name="recipe/[id]" options={{ title: 'Recipe' }} />
      <Stack.Screen name="create-recipe" options={{ presentation: 'modal', title: 'Create Recipe' }} />
      <Stack.Screen name="create-customer" options={{ presentation: 'modal', title: 'Add Customer' }} />
      <Stack.Screen name="edit-customer/[id]" options={{ title: 'Edit Customer' }} />
      <Stack.Screen name="edit-order/[id]" options={{ title: 'Edit Order' }} />
      <Stack.Screen name="user-management" options={{ title: 'User Management' }} />
    </Stack>
  );
}

