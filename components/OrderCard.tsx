import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Order } from '@/types/order';
import { Colors } from '@/constants/colors';
import { StatusBadge } from './StatusBadge';
import { Clock, User, CheckCircle2, Circle } from 'lucide-react-native';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  onTogglePaid?: () => void;
}

export function OrderCard({ order, onPress, onTogglePaid }: OrderCardProps) {
  const deadline = new Date(order.deadline);
  const isUrgent = deadline.getTime() - Date.now() < 24 * 60 * 60 * 1000; // Less than 24 hours

  return (
    <TouchableOpacity style={[styles.card, isUrgent && styles.urgentCard]} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.customerInfo}>
          <User size={16} color={Colors.textSecondary} />
          <Text style={styles.customerName}>{order.customerName}</Text>
        </View>
        <StatusBadge status={order.status} size="small" />
      </View>

      <View style={styles.items}>
        {order.items.map((item, index) => (
          <Text key={item.id} style={styles.itemText}>
            {item.quantity}x {item.name}
            {index < order.items.length - 1 && ', '}
          </Text>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.deadline}>
          <Clock size={14} color={isUrgent ? Colors.error : Colors.textSecondary} />
          <Text style={[styles.deadlineText, isUrgent && styles.urgentText]}>
            Due: {deadline.toLocaleDateString()} at {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={onTogglePaid}
          disabled={!onTogglePaid}
          style={[styles.paidPill, order.paid ? styles.paid : styles.unpaid]}
          testID="paid-status-pill"
          activeOpacity={0.7}
        >
          {order.paid ? (
            <CheckCircle2 size={14} color={Colors.surface} />
          ) : (
            <Circle size={14} color={Colors.surface} />
          )}
          <Text style={styles.paidText}>{order.paid ? 'Paid' : 'Not paid'}</Text>
        </TouchableOpacity>
      </View>

      {order.specialNotes && (
        <Text style={styles.notes} numberOfLines={2}>
          Note: {order.specialNotes}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urgentCard: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  items: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  itemText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  urgentText: {
    color: Colors.error,
    fontWeight: '600',
  },
  notes: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  paidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  paid: {
    backgroundColor: '#10B981',
  },
  unpaid: {
    backgroundColor: '#F59E0B',
  },
  paidText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
});