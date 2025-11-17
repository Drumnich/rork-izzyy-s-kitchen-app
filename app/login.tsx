import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { Colors } from '@/constants/colors';
import { ChefHat, Lock } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, currentUser, logout } = useAuthStore();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Force logout on component mount to ensure clean state
  useEffect(() => {
    console.log('📱 LoginScreen - Component mounted, forcing logout to ensure clean state');
    logout();
  }, [logout]);

  // Check if user is already authenticated and redirect
  useEffect(() => {
    console.log('📱 LoginScreen - Auth check:', { isAuthenticated, currentUser: currentUser?.name });
    if (isAuthenticated && currentUser) {
      console.log('📱 LoginScreen - User already authenticated, redirecting to app');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, currentUser, router]);

  const handleLogin = async () => {
    console.log('📱 handleLogin called with PIN:', pin);
    
    if (!pin.trim()) {
      Alert.alert('Error', 'Please enter your PIN');
      return;
    }

    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be exactly 4 digits');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('📱 Attempting login...');
      
      const success = await login(pin.trim());
      console.log('📱 Login result:', success);
      
      if (success) {
        console.log('📱 Login successful! Redirecting to app...');
        setPin('');
        // Navigate to the main app
        router.replace('/(tabs)');
      } else {
        console.log('📱 Login failed - invalid PIN');
        Alert.alert('Error', 'Invalid PIN. Please try again.');
        setPin('');
      }
    } catch (error) {
      console.error('📱 Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinPress = (digit: string) => {
    console.log('📱 handlePinPress called with digit:', digit, 'current PIN:', pin);
    
    if (pin.length < 4 && !isLoading) {
      const newPin = pin + digit;
      console.log('📱 Setting new PIN:', newPin);
      setPin(newPin);
      
      // Auto-submit when PIN reaches 4 digits
      if (newPin.length === 4) {
        console.log('📱 PIN complete, auto-submitting in 300ms');
        setTimeout(() => {
          handleLoginWithPin(newPin);
        }, 300);
      }
    }
  };

  const handleLoginWithPin = async (pinToUse: string) => {
    console.log('📱 Auto-login with PIN:', pinToUse);
    
    if (isLoading) {
      console.log('📱 Already loading, skipping auto-login');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(pinToUse.trim());
      console.log('📱 Auto-login result:', success);
      
      if (success) {
        console.log('📱 Auto-login successful! Redirecting to app...');
        // Navigate to the main app
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Invalid PIN. Please try again.');
        setPin('');
      }
    } catch (error) {
      console.error('📱 Auto-login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackspace = () => {
    if (!isLoading && pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const handleClearPin = () => {
    if (!isLoading) {
      setPin('');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <ChefHat size={48} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Izzyy's Kitchen</Text>
          <Text style={styles.subtitle}>Enter your 4-digit PIN to continue</Text>
        </View>

        <View style={styles.pinContainer}>
          <View style={styles.pinDisplay}>
            {[...Array(4)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.pinDot,
                  index < pin.length && styles.pinDotFilled
                ]}
              />
            ))}
          </View>

          <View style={styles.keypad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <TouchableOpacity
                key={digit}
                style={[styles.keypadButton, isLoading && styles.keypadButtonDisabled]}
                onPress={() => handlePinPress(digit.toString())}
                disabled={isLoading}
              >
                <Text style={[styles.keypadButtonText, isLoading && styles.keypadButtonTextDisabled]}>
                  {digit}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.keypadButton, isLoading && styles.keypadButtonDisabled]}
              onPress={handleClearPin}
              disabled={isLoading}
            >
              <Text style={[styles.keypadButtonText, isLoading && styles.keypadButtonTextDisabled]}>
                C
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.keypadButton, isLoading && styles.keypadButtonDisabled]}
              onPress={() => handlePinPress('0')}
              disabled={isLoading}
            >
              <Text style={[styles.keypadButtonText, isLoading && styles.keypadButtonTextDisabled]}>
                0
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.keypadButton, isLoading && styles.keypadButtonDisabled]}
              onPress={handleBackspace}
              disabled={isLoading}
            >
              <Text style={[styles.keypadButtonText, isLoading && styles.keypadButtonTextDisabled]}>
                ⌫
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.loginButton, (!pin || isLoading) && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={!pin || isLoading}
        >
          <Lock size={20} color={Colors.surface} />
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>


      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  pinDisplay: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pinDotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    gap: 16,
  },
  keypadButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keypadButtonDisabled: {
    opacity: 0.5,
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  keypadButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },

});