import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  const { isAuthenticated, currentUser } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    setIsNavigationReady(true);
  }, []);

  useEffect(() => {
    const requestNotificationPermissions = async () => {
      if (Platform.OS === 'web') {
        console.log('📲 Notifications - Skipping permissions on web');
        return;
      }
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('📲 Notifications - Permission not granted');
        return;
      }
      
      console.log('📲 Notifications - Permission granted');
    };
    
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    if (!isNavigationReady) return;

    const inAuthGroup = segments[0] === 'login';

    console.log('🏠 RootLayoutNav - Auth check:', { 
      isAuthenticated, 
      hasUser: !!currentUser,
      userName: currentUser?.name,
      inAuthGroup,
      segments
    });

    if (!isAuthenticated && !inAuthGroup) {
      console.log('🏠 RootLayoutNav - Redirecting to login');
      router.replace('/login');
      setHasCheckedAuth(true);
    } else if (isAuthenticated && inAuthGroup) {
      console.log('🏠 RootLayoutNav - Redirecting to tabs');
      router.replace('/(tabs)');
      setHasCheckedAuth(true);
    } else {
      setHasCheckedAuth(true);
    }
  }, [isAuthenticated, currentUser, segments, isNavigationReady, router]);

  if (!hasCheckedAuth) {
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

