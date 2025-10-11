import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useOrderStore } from '@/stores/order-store';
import { useAuthStore } from '@/stores/auth-store';
import { useRecipeStore } from '@/stores/recipe-store';
import { mockProducts } from '@/mocks/products';
import { StatusBadge } from '@/components/StatusBadge';
import { Colors } from '@/constants/colors';
import { OrderStatus } from '@/types/order';
import { Clock, User, FileText, Edit3, Trash2, Edit } from 'lucide-react-native';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getOrderById, updateOrderStatus, deleteOrder } = useOrderStore();
  const { getRecipeById } = useRecipeStore();
  const { currentUser } = useAuthStore();
  
  const order = getOrderById(id!);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isDeletingOrder, setIsDeletingOrder] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  if (!currentUser) {
    return null;
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Order Not Found' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </View>
    );
  }

  const deadline = new Date(order.deadline);
  const isUrgent = deadline.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  const statusOptions = useMemo(() => ([
    { label: 'Pending', value: 'pending' as OrderStatus },
    { label: 'In Progress', value: 'in-progress' as OrderStatus },
    { label: 'Ready', value: 'ready' as OrderStatus },
    { label: 'Completed', value: 'completed' as OrderStatus },
  ]), []);

  const availableStatusOptions = useMemo(
    () => statusOptions.filter((o) => o.value !== order.status),
    [statusOptions, order.status]
  );

  const handleStatusUpdate = () => {
    console.log('🔧 Order Detail - Status update button pressed for order:', order.id);
    if (isUpdatingStatus) {
      console.log('🔧 Order Detail - Already updating status, ignoring press');
      return;
    }
    if (Platform.OS === 'web') {
      setShowStatusModal(true);
      return;
    }
    setShowStatusModal(true);
  };

  const handleEditOrder = () => {
    console.log('🔧 Order Detail - Edit button pressed for order:', order.id);
    router.push(`/edit-order/${order.id}`);
  };

  const handleDeleteOrder = () => {
    console.log('🔧 Order Detail - Delete button pressed for order:', order.id);
    if (isDeletingOrder) return;
    setShowDeleteModal(true);
  };

  const handleViewRecipe = (itemName: string) => {
    // Find the product that matches the item name
    const product = mockProducts.find(p => p.name === itemName);
    
    if (product && product.recipeId) {
      // Check if the recipe exists
      const recipe = getRecipeById(product.recipeId);
      if (recipe) {
        router.push(`/recipe/${product.recipeId}`);
      } else {
        Alert.alert('Recipe Not Found', `Recipe for ${itemName} is not available.`);
      }
    } else {
      Alert.alert('Recipe Not Available', `No recipe found for ${itemName}.`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: `Order #${order.id.slice(-4)}`,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }} 
      />

      <View style={styles.content}>
        {/* Order Header */}
        <View style={styles.header}>
          <View style={styles.customerInfo}>
            <User size={20} color={Colors.textSecondary} />
            <Text style={styles.customerName}>{order.customerName}</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>

        {/* Deadline */}
        <View style={[styles.deadlineCard, isUrgent && styles.urgentDeadlineCard]}>
          <Clock size={18} color={isUrgent ? Colors.error : Colors.textSecondary} />
          <View>
            <Text style={[styles.deadlineLabel, isUrgent && styles.urgentText]}>
              Deadline
            </Text>
            <Text style={[styles.deadlineText, isUrgent && styles.urgentText]}>
              {deadline.toLocaleDateString()} at {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>×{item.quantity}</Text>
              </View>
              {item.notes && (
                <Text style={styles.itemNotes}>Note: {item.notes}</Text>
              )}
              <TouchableOpacity 
                style={styles.recipeButton}
                onPress={() => handleViewRecipe(item.name)}
              >
                <FileText size={14} color={Colors.primary} />
                <Text style={styles.recipeButtonText}>View Recipe</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Special Notes */}
        {order.specialNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{order.specialNotes}</Text>
            </View>
          </View>
        )}

        {/* Order Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Timeline</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Created</Text>
              <Text style={styles.timelineDate}>
                {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Last Updated</Text>
              <Text style={styles.timelineDate}>
                {new Date(order.updatedAt).toLocaleDateString()} at{' '}
                {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEditOrder}
              activeOpacity={0.7}
              testID="edit-order-button"
            >
              <Edit size={20} color={Colors.surface} />
              <Text style={styles.actionButtonText}>Edit Order</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.updateButton]}
              onPress={handleStatusUpdate}
              activeOpacity={0.7}
              testID="update-status-button"
            >
              <Edit3 size={20} color={Colors.surface} />
              <Text style={styles.actionButtonText}>
                {isUpdatingStatus ? 'Updating...' : 'Update Status'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteActionButton]}
              onPress={handleDeleteOrder}
              activeOpacity={0.7}
              testID="delete-order-button"
            >
              <Trash2 size={20} color={Colors.surface} />
              <Text style={styles.actionButtonText}>
                {isDeletingOrder ? 'Deleting...' : 'Delete Order'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Debug Info for Testing */}
        {__DEV__ && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>Debug Info</Text>
            <Text style={styles.debugText}>Order ID: {order.id}</Text>
            <Text style={styles.debugText}>Current User Role: {currentUser.role}</Text>
            <Text style={styles.debugText}>Is Updating: {isUpdatingStatus.toString()}</Text>
            <Text style={styles.debugText}>Is Deleting: {isDeletingOrder.toString()}</Text>
          </View>
        )}
      </View>

      {/* Status modal (web friendly) */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Order Status</Text>
            <View style={{ gap: 8 }}>
              {availableStatusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.modalButton, styles.updateButton]}
                  onPress={async () => {
                    try {
                      setIsUpdatingStatus(true);
                      await updateOrderStatus(order.id, option.value);
                      Alert.alert('Success', `Order status updated to ${option.label}`);
                      setShowStatusModal(false);
                    } catch (error) {
                      const msg = error instanceof Error ? error.message : 'Failed to update order status';
                      Alert.alert('Error', msg);
                    } finally {
                      setIsUpdatingStatus(false);
                    }
                  }}
                  testID={`status-option-${option.value}`}
                >
                  <Text style={styles.actionButtonText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowStatusModal(false)}
                testID="cancel-status-modal"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete modal (web friendly) */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Order</Text>
            <Text style={styles.modalSubtitle}>This action cannot be undone.</Text>
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteActionButton]}
                onPress={async () => {
                  try {
                    setIsDeletingOrder(true);
                    await deleteOrder(order.id);
                    setShowDeleteModal(false);
                    Alert.alert('Deleted', 'Order deleted successfully');
                    router.back();
                  } catch (error) {
                    const msg = error instanceof Error ? error.message : 'Failed to delete order';
                    Alert.alert('Error', msg);
                  } finally {
                    setIsDeletingOrder(false);
                  }
                }}
                testID="confirm-delete"
              >
                <Text style={styles.actionButtonText}>{isDeletingOrder ? 'Deleting...' : 'Delete'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
                testID="cancel-delete"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  urgentDeadlineCard: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  deadlineLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  deadlineText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  urgentText: {
    color: Colors.error,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  itemNotes: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  recipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  recipeButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  notesCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  timelineCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timelineItem: {
    marginBottom: 12,
  },
  timelineLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 14,
    color: Colors.text,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    minHeight: 56,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  modalButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#6366F1',
  },
  updateButton: {
    backgroundColor: Colors.primary,
  },
  deleteActionButton: {
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  debugSection: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
});