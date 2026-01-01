import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useOrderStore } from '@/stores/order-store';
import { useAuthStore } from '@/stores/auth-store';
import { OrderCard } from '@/components/OrderCard';
import { Colors } from '@/constants/colors';
import { Plus, LogOut } from 'lucide-react-native';

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, loadOrders, isLoading, updateOrderPaid } = useOrderStore();
  const { currentUser, isAuthenticated, logout } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    if (!isAuthenticated || !currentUser) {
      console.log('📱 OrdersScreen - Not authenticated, redirecting to login');
      try {
        router.replace('/login');
      } catch (error) {
        console.error('📱 OrdersScreen - Navigation error:', error);
      }
    }
  }, [isAuthenticated, currentUser, router, isMounted]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      console.log('📱 OrdersScreen - Component mounted, loading orders...');
      loadOrders().catch((error) => {
        console.error('📱 OrdersScreen - Failed to load orders:', error);
      });
    }
  }, [loadOrders, isAuthenticated, currentUser]);

  const activeOrders = useMemo(() => {
    return orders
      .filter(order => order.status !== 'completed')
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [orders]);

  const handleOrderPress = (orderId: string) => {
    router.push(`/order/${orderId}`);
  };

  const handleCreateOrder = () => {
    console.log('🏠 OrdersScreen - Create order button pressed');
    router.push('/create-order');
  };

  const handleLogout = () => {
    console.log('🏠 OrdersScreen - Logout button pressed');
    logout();
  };

  const handleTogglePaid = useCallback(async (orderId: string, current: boolean) => {
    try {
      await updateOrderPaid(orderId, !current);
      Alert.alert('Success', `Marked as ${!current ? 'paid' : 'not paid'}.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update paid status';
      Alert.alert('Error', msg);
    }
  }, [updateOrderPaid]);

  if (!currentUser) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Izzyy's Kitchen",
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <LogOut size={18} color={Colors.text} />
              </TouchableOpacity>
              {currentUser.role === 'admin' && (
                <TouchableOpacity onPress={handleCreateOrder} style={styles.createOrderHeaderButton}>
                  <Plus size={24} color={Colors.surface} />
                  <Text style={styles.createOrderHeaderButtonText}>Order</Text>
                </TouchableOpacity>
              )}
            </View>
          ),
        }} 
      />

      <View style={styles.header}>
        <Text style={styles.greeting}>
          Welcome, {currentUser.name}
        </Text>
        <Text style={styles.role}>
          {currentUser.role === 'admin' ? 'Kitchen Manager' : 'Kitchen Staff'}
        </Text>
        <Text style={styles.title}>Active Orders</Text>
        <Text style={styles.subtitle}>
          {activeOrders.length} order{activeOrders.length !== 1 ? 's' : ''} in progress
        </Text>
      </View>

      {currentUser.role === 'admin' && (
        <View style={styles.adminActions}>
          <TouchableOpacity style={styles.createOrderButton} onPress={handleCreateOrder}>
            <Plus size={24} color={Colors.surface} />
            <Text style={styles.createOrderButtonText}>Create New Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : activeOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No active orders</Text>
          <Text style={styles.emptySubtitle}>
            {currentUser.role === 'admin' 
              ? "Use the 'Create New Order' button above to add your first order" 
              : "Check back later for new orders"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard 
              order={item} 
              onPress={() => handleOrderPress(item.id)} 
              onTogglePaid={() => handleTogglePaid(item.id, item.paid)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  createOrderHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    minHeight: 44,
    minWidth: 100,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  createOrderHeaderButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
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
  adminActions: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  createOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createOrderButtonText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
});