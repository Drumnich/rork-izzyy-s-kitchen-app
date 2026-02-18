import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/auth-store';
import { Colors } from '@/constants/colors';
import { ChefHat, Lock, ShieldAlert } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, currentUser } = useAuthStore();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState('');
  const [logoTapCount, setLogoTapCount] = useState(0);
  const logoTapTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const LOCKOUT_KEY = 'login_lockout';
  const ATTEMPTS_KEY = 'login_failed_attempts';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 24 * 60 * 60 * 1000;

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const loadLockoutState = useCallback(async () => {
    try {
      const [storedLockout, storedAttempts] = await Promise.all([
        AsyncStorage.getItem(LOCKOUT_KEY),
        AsyncStorage.getItem(ATTEMPTS_KEY),
      ]);
      if (storedLockout) {
        const lockTime = parseInt(storedLockout, 10);
        if (Date.now() < lockTime) {
          setLockedUntil(lockTime);
        } else {
          await AsyncStorage.multiRemove([LOCKOUT_KEY, ATTEMPTS_KEY]);
          setLockedUntil(null);
          setFailedAttempts(0);
        }
      }
      if (storedAttempts) {
        setFailedAttempts(parseInt(storedAttempts, 10));
      }
    } catch (e) {
      console.error('📱 Error loading lockout state:', e);
    }
  }, []);

  useEffect(() => {
    console.log('📱 LoginScreen - Component mounted');
    loadLockoutState();
  }, [loadLockoutState]);

  useEffect(() => {
    if (!lockedUntil || Date.now() >= lockedUntil) {
      setLockCountdown('');
      return;
    }
    const tick = () => {
      const remaining = lockedUntil - Date.now();
      if (remaining <= 0) {
        setLockedUntil(null);
        setFailedAttempts(0);
        AsyncStorage.multiRemove([LOCKOUT_KEY, ATTEMPTS_KEY]);
        setLockCountdown('');
        return;
      }
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      setLockCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const recordFailedAttempt = useCallback(async () => {
    const newCount = failedAttempts + 1;
    setFailedAttempts(newCount);
    await AsyncStorage.setItem(ATTEMPTS_KEY, newCount.toString());
    console.log(`📱 Failed attempt ${newCount}/${MAX_ATTEMPTS}`);
    if (newCount >= MAX_ATTEMPTS) {
      const lockTime = Date.now() + LOCKOUT_DURATION;
      setLockedUntil(lockTime);
      await AsyncStorage.setItem(LOCKOUT_KEY, lockTime.toString());
      console.log('📱 Account locked for 24 hours');
      Alert.alert(
        'Account Locked',
        'Too many failed attempts. You are locked out for 24 hours.'
      );
    }
  }, [failedAttempts]);

  const resetAttempts = useCallback(async () => {
    setFailedAttempts(0);
    await AsyncStorage.removeItem(ATTEMPTS_KEY);
  }, []);

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
    
    if (isLocked) {
      Alert.alert('Account Locked', 'Too many failed attempts. Please try again later.');
      return;
    }

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
        await resetAttempts();
        setPin('');
        router.replace('/(tabs)');
      } else {
        console.log('📱 Login failed - invalid PIN');
        await recordFailedAttempt();
        const remaining = MAX_ATTEMPTS - (failedAttempts + 1);
        if (remaining > 0) {
          Alert.alert('Error', `Invalid PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
        }
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
    
    if (pin.length < 4 && !isLoading && !isLocked) {
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
    
    if (isLoading || isLocked) {
      console.log('📱 Already loading or locked, skipping auto-login');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(pinToUse.trim());
      console.log('📱 Auto-login result:', success);
      
      if (success) {
        console.log('📱 Auto-login successful! Redirecting to app...');
        await resetAttempts();
        router.replace('/(tabs)');
      } else {
        await recordFailedAttempt();
        const remaining = MAX_ATTEMPTS - (failedAttempts + 1);
        if (remaining > 0) {
          Alert.alert('Error', `Invalid PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
        }
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
          <TouchableOpacity
            style={styles.logoContainer}
            activeOpacity={0.8}
            onPress={() => {
              const newCount = logoTapCount + 1;
              setLogoTapCount(newCount);
              if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current);
              logoTapTimerRef.current = setTimeout(() => setLogoTapCount(0), 2000);
              if (newCount >= 5) {
                setLogoTapCount(0);
                setLockedUntil(null);
                setFailedAttempts(0);
                AsyncStorage.multiRemove([LOCKOUT_KEY, ATTEMPTS_KEY]);
                Alert.alert('Reset', 'Login lockout has been cleared.');
              }
            }}
          >
            <ChefHat size={48} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Izzyy&apos;s Kitchen</Text>
          <Text style={styles.subtitle}>Enter your 4-digit PIN to continue</Text>
        </View>

        {isLocked ? (
          <View style={styles.lockoutContainer}>
            <ShieldAlert size={56} color={Colors.error} />
            <Text style={styles.lockoutTitle}>Account Locked</Text>
            <Text style={styles.lockoutMessage}>
              Too many failed login attempts. Please try again in:
            </Text>
            <Text style={styles.lockoutTimer}>{lockCountdown}</Text>
          </View>
        ) : (
        <View style={styles.pinContainer}>
          {failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && (
            <Text style={styles.attemptsWarning}>
              {MAX_ATTEMPTS - failedAttempts} attempt{MAX_ATTEMPTS - failedAttempts === 1 ? '' : 's'} remaining
            </Text>
          )}
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
        )}

        {!isLocked && (
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
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Enter your 4-digit PIN to sign in</Text>
        </View>
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
  footer: {
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  lockoutContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  lockoutTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.error,
    marginTop: 8,
  },
  lockoutMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  lockoutTimer: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
    letterSpacing: 1,
  },
  attemptsWarning: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
});