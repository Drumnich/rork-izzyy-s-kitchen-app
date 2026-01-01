import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
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
  const { isAuthenticated, currentUser } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initTimeout, setInitTimeout] = useState(false);

  // Add a small delay to ensure proper initialization
  useEffect(() => {
    console.log('🏠 RootLayoutNav - Initializing...');
    const timer = setTimeout(() => {
      console.log('🏠 RootLayoutNav - Initialization complete');
      setIsInitialized(true);
    }, 100);
    
    // Add a timeout to catch if initialization takes too long
    const timeoutTimer = setTimeout(() => {
      console.warn('🏠 RootLayoutNav - Initialization timeout! Forcing initialization.');
      setInitTimeout(true);
      setIsInitialized(true);
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timeoutTimer);
    };
  }, []);

  console.log('🏠 RootLayoutNav - Auth state check:', { 
    isAuthenticated, 
    currentUser: currentUser?.name,
    isInitialized,
    initTimeout,
    timestamp: new Date().toISOString()
  });

  // Show loading until initialized
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading app...</Text>
      </View>
    );
  }

  // CRITICAL: Always show login screen first if not properly authenticated
  // This ensures the app ALWAYS starts with login screen
  if (!isAuthenticated || !currentUser) {
    console.log('🏠 RootLayoutNav - Not authenticated, showing login screen');
    return (
      <Stack
        screenOptions={{
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    );
  }

  // Only show app screens if user is fully authenticated
  console.log('🏠 RootLayoutNav - Authenticated, showing app screens');
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
      }}
    >
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
});