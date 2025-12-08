import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrderStore } from '@/stores/order-store';
import { Colors } from '@/constants/colors';
import { Package } from 'lucide-react-native';

type ProductQuantity = {
  productName: string;
  quantity: number;
};

type DayProduction = {
  date: string;
  dateLabel: string;
  products: ProductQuantity[];
};

export default function ProductionScreen() {
  const { orders, loadOrders, isLoading } = useOrderStore();

  const productionData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dayAfterStr = dayAfterTomorrow.toISOString().split('T')[0];

    const tomorrowProducts = new Map<string, number>();
    const dayAfterProducts = new Map<string, number>();

    orders.forEach(order => {
      if (order.status === 'completed') return;
      
      const orderDate = new Date(order.deadline);
      const orderDateStr = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate())
        .toISOString().split('T')[0];

      let targetMap: Map<string, number> | null = null;
      
      if (orderDateStr === tomorrowStr) {
        targetMap = tomorrowProducts;
      } else if (orderDateStr === dayAfterStr) {
        targetMap = dayAfterProducts;
      }

      if (targetMap) {
        order.items.forEach(item => {
          const current = targetMap.get(item.name) || 0;
          targetMap.set(item.name, current + item.quantity);
        });
      }
    });

    const formatProducts = (map: Map<string, number>): ProductQuantity[] => {
      return Array.from(map.entries())
        .map(([name, quantity]) => ({ productName: name, quantity }))
        .sort((a, b) => a.productName.localeCompare(b.productName));
    };

    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const result: DayProduction[] = [
      {
        date: tomorrowStr,
        dateLabel: formatDate(tomorrow),
        products: formatProducts(tomorrowProducts),
      },
      {
        date: dayAfterStr,
        dateLabel: formatDate(dayAfterTomorrow),
        products: formatProducts(dayAfterProducts),
      },
    ];

    return result;
  }, [orders]);

  const renderDaySection = (dayData: DayProduction) => {
    return (
      <View key={dayData.date} style={styles.daySection}>
        <View style={styles.dayHeader}>
          <Package size={24} color={Colors.primary} />
          <View style={styles.dayHeaderText}>
            <Text style={styles.dayTitle}>{dayData.dateLabel}</Text>
            <Text style={styles.daySubtitle}>
              {dayData.products.reduce((sum, p) => sum + p.quantity, 0)} total items
            </Text>
          </View>
        </View>

        {dayData.products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders for this day</Text>
          </View>
        ) : (
          <View style={styles.productsContainer}>
            {dayData.products.map((product, index) => (
              <View 
                key={`${product.productName}-${index}`} 
                style={styles.productRow}
              >
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>{product.quantity}</Text>
                </View>
                <Text style={styles.productName}>{product.productName}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{ 
          title: 'Production Plan',
          headerShown: true,
        }} 
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={loadOrders}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Production Schedule</Text>
          <Text style={styles.headerSubtitle}>
            What needs to be ready for the next 2 days
          </Text>
        </View>

        {productionData.map(dayData => renderDaySection(dayData))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  daySection: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  daySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  productsContainer: {
    gap: 8,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  quantityBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
});
