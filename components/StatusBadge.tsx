import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OrderStatus } from '@/types/order';
import { Colors } from '@/constants/colors';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'small' | 'medium';
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  ready: 'Ready',
  completed: 'Completed',
};

export function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  return (
    <View style={[
      styles.badge,
      { backgroundColor: Colors.status[status] },
      size === 'small' && styles.badgeSmall
    ]}>
      <Text style={[
        styles.badgeText,
        size === 'small' && styles.badgeTextSmall
      ]}>
        {statusLabels[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  badgeTextSmall: {
    fontSize: 10,
  },
});