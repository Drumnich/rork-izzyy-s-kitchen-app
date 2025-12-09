import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { useOrderStore } from '@/stores/order-store';
import { Colors } from '@/constants/colors';
import { Package, Calendar } from 'lucide-react-native';

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
  const [viewMode, setViewMode] = useState<'1month' | '2months'>('1month');

  const productionData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const daysToShow = viewMode === '1month' ? 30 : 60;
    const dateMap = new Map<string, Map<string, number>>();
    
    for (let i = 1; i <= daysToShow; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      const dateStr = futureDate.toISOString().split('T')[0];
      dateMap.set(dateStr, new Map<string, number>());
    }

    orders.forEach(order => {
      if (order.status === 'completed') return;
      
      const orderDate = new Date(order.deadline);
      const orderDateStr = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate())
        .toISOString().split('T')[0];

      if (dateMap.has(orderDateStr)) {
        const productsMap = dateMap.get(orderDateStr)!;
        order.items.forEach(item => {
          const current = productsMap.get(item.name) || 0;
          productsMap.set(item.name, current + item.quantity);
        });
      }
    });

    const formatProducts = (map: Map<string, number>): ProductQuantity[] => {
      return Array.from(map.entries())
        .map(([name, quantity]) => ({ productName: name, quantity }))
        .sort((a, b) => a.productName.localeCompare(b.productName));
    };

    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const result: DayProduction[] = [];
    
    for (let i = 1; i <= daysToShow; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      const dateStr = futureDate.toISOString().split('T')[0];
      const productsMap = dateMap.get(dateStr)!;
      
      if (productsMap.size > 0) {
        result.push({
          date: dateStr,
          dateLabel: formatDate(futureDate),
          products: formatProducts(productsMap),
        });
      }
    }

    return result;
  }, [orders, viewMode]);

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
    <View style={styles.container}>
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
            What needs to be ready for the next {viewMode === '1month' ? 'month' : '2 months'}
          </Text>
          
          <View style={styles.viewModeButtons}>
            <Pressable 
              style={[styles.viewModeButton, viewMode === '1month' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('1month')}
            >
              <Calendar size={16} color={viewMode === '1month' ? '#FFFFFF' : Colors.primary} />
              <Text style={[styles.viewModeText, viewMode === '1month' && styles.viewModeTextActive]}>
                1 Month
              </Text>
            </Pressable>
            
            <Pressable 
              style={[styles.viewModeButton, viewMode === '2months' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('2months')}
            >
              <Calendar size={16} color={viewMode === '2months' ? '#FFFFFF' : Colors.primary} />
              <Text style={[styles.viewModeText, viewMode === '2months' && styles.viewModeTextActive]}>
                2 Months
              </Text>
            </Pressable>
          </View>
        </View>

        {productionData.length === 0 ? (
          <View style={styles.noOrdersContainer}>
            <Package size={48} color={Colors.textSecondary} />
            <Text style={styles.noOrdersText}>No orders in the selected period</Text>
          </View>
        ) : (
          productionData.map(dayData => renderDaySection(dayData))
        )}
      </ScrollView>
    </View>
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
    paddingBottom: 120,
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
    marginBottom: 16,
  },
  viewModeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 8,
  },
  viewModeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  viewModeTextActive: {
    color: '#FFFFFF',
  },
  noOrdersContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  noOrdersText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
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
