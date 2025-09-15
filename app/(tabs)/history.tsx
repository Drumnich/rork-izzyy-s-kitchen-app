import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useOrderStore } from '@/stores/order-store';
import { useAuthStore } from '@/stores/auth-store';
import { OrderCard } from '@/components/OrderCard';
import { Colors } from '@/constants/colors';
import { Search, Calendar } from 'lucide-react-native';

type FilterType = 'all' | 'completed' | 'this-week' | 'this-month';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { orders, loadOrders, isLoading } = useOrderStore();
  const { currentUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<FilterType>('all');

  // Load orders when component mounts
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      console.log('📜 HistoryScreen - No current user, redirecting to login');
      router.replace('/login');
    }
  }, [currentUser, router]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(order => 
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by time period and status
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'completed':
        filtered = filtered.filter(order => order.status === 'completed');
        break;
      case 'this-week':
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= oneWeekAgo;
        });
        break;
      case 'this-month':
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= oneMonthAgo;
        });
        break;
      case 'all':
      default:
        // Show all orders
        break;
    }

    // Sort by creation date (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchQuery, filter]);

  const handleOrderPress = (orderId: string) => {
    router.push(`/order/${orderId}`);
  };

  const getFilterButtonStyle = (filterType: FilterType) => [
    styles.filterButton,
    filter === filterType && styles.activeFilterButton
  ];

  const getFilterTextStyle = (filterType: FilterType) => [
    styles.filterButtonText,
    filter === filterType && styles.activeFilterButtonText
  ];

  if (!currentUser) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Order History",
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }} 
      />

      <View style={styles.header}>
        <Text style={styles.title}>Order History</Text>
        <Text style={styles.subtitle}>
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer or item..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={getFilterButtonStyle('all')} 
          onPress={() => setFilter('all')}
        >
          <Text style={getFilterTextStyle('all')}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={getFilterButtonStyle('completed')} 
          onPress={() => setFilter('completed')}
        >
          <Text style={getFilterTextStyle('completed')}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={getFilterButtonStyle('this-week')} 
          onPress={() => setFilter('this-week')}
        >
          <Text style={getFilterTextStyle('this-week')}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={getFilterButtonStyle('this-month')} 
          onPress={() => setFilter('this-month')}
        >
          <Text style={getFilterTextStyle('this-month')}>This Month</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading order history...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>
            {searchQuery.trim() || filter !== 'all' ? 'No orders found' : 'No order history'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery.trim() || filter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Orders will appear here once they are created'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard 
              order={item} 
              onPress={() => handleOrderPress(item.id)} 
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeFilterButtonText: {
    color: Colors.surface,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});