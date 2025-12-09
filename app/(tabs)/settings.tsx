import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useOrderStore } from '@/stores/order-store';
import { useAuthStore } from '@/stores/auth-store';
import { Colors } from '@/constants/colors';
import { User, Shield, Trash2, Users, LogOut, Database } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { orders } = useOrderStore();
  const { currentUser, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            console.log('🔧 SettingsScreen - Logout confirmed');
            logout();
            // Force navigation to login screen
            router.replace('/login');
          }
        },
      ]
    );
  };

  const handleUserManagement = () => {
    router.push('/user-management');
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all orders. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            useOrderStore.setState({ orders: [] });
            Alert.alert('Success', 'All order data has been cleared.');
          }
        },
      ]
    );
  };

  if (!currentUser) {
    return null;
  }

  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const activeOrders = orders.filter(order => order.status !== 'completed').length;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Settings",
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }} 
      />

      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your kitchen app preferences</Text>
      </View>

      {/* User Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current User</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            {currentUser.role === 'admin' ? (
              <Shield size={20} color={Colors.primary} />
            ) : (
              <User size={20} color={Colors.textSecondary} />
            )}
            <View>
              <Text style={styles.settingTitle}>{currentUser.name}</Text>
              <Text style={styles.settingSubtitle}>
                {currentUser.role === 'admin' ? 'Kitchen Manager' : 'Kitchen Staff'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Data Overview Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Overview</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Database size={20} color={Colors.textSecondary} />
            <View>
              <Text style={styles.settingTitle}>Orders</Text>
              <Text style={styles.settingSubtitle}>
                {activeOrders} active • {completedOrders} completed
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Admin Only Sections */}
      {currentUser.role === 'admin' && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Management</Text>
            <TouchableOpacity style={styles.settingItem} onPress={handleUserManagement}>
              <View style={styles.settingLeft}>
                <Users size={20} color={Colors.primary} />
                <View>
                  <Text style={styles.settingTitle}>Manage Users</Text>
                  <Text style={styles.settingSubtitle}>
                    Add, edit, or remove kitchen staff
                  </Text>
                </View>
              </View>
              <Text style={styles.settingAction}>Manage</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
              <View style={styles.settingLeft}>
                <Trash2 size={20} color={Colors.error} />
                <View>
                  <Text style={[styles.settingTitle, { color: Colors.error }]}>
                    Clear All Orders
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    Delete all orders from the system
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Sign Out Section */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <View style={styles.settingLeft}>
            <LogOut size={20} color={Colors.error} />
            <View>
              <Text style={[styles.settingTitle, { color: Colors.error }]}>
                Sign Out
              </Text>
              <Text style={styles.settingSubtitle}>
                Sign out of your account
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Izzyy's Cookies Kitchen Management</Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  settingAction: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingBottom: 100,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footerVersion: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});