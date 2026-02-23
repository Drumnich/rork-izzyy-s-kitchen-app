import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useOrderStore } from '@/stores/order-store';
import { useAuthStore } from '@/stores/auth-store';
import { useRecipeStore } from '@/stores/recipe-store';
import { mockProducts } from '@/mocks/products';
import { StatusBadge } from '@/components/StatusBadge';
import { Colors } from '@/constants/colors';
import { OrderStatus, Order } from '@/types/order';
import { Clock, User, FileText, Edit3, Trash2, Edit, DollarSign, Download } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getOrderById, updateOrderStatus, deleteOrder, updateOrderPaid } = useOrderStore();
  const { getRecipeById } = useRecipeStore();
  const { currentUser } = useAuthStore();
  
  const order = getOrderById(id!);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isDeletingOrder, setIsDeletingOrder] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isTogglingPaid, setIsTogglingPaid] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

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

  const statusOptions = [
    { label: 'Pending', value: 'pending' as OrderStatus },
    { label: 'In Progress', value: 'in-progress' as OrderStatus },
    { label: 'Ready', value: 'ready' as OrderStatus },
    { label: 'Completed', value: 'completed' as OrderStatus },
  ];

  const availableStatusOptions = statusOptions.filter((o) => o.value !== order.status);

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

  const handleTogglePaid = async () => {
    if (isTogglingPaid) return;
    try {
      setIsTogglingPaid(true);
      await updateOrderPaid(order.id, !order.paid);
      Alert.alert('Success', `Marked as ${!order.paid ? 'paid' : 'not paid'}.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update paid status';
      Alert.alert('Error', msg);
    } finally {
      setIsTogglingPaid(false);
    }
  };

  const generateOrderHtml = (order: Order): string => {
    const deadline = new Date(order.deadline);
    const createdAt = new Date(order.createdAt);
    const updatedAt = new Date(order.updatedAt);

    const statusLabel = {
      'pending': 'Pending',
      'in-progress': 'In Progress',
      'ready': 'Ready',
      'completed': 'Completed',
    }[order.status] || order.status;

    const statusColor = {
      'pending': '#FFB74D',
      'in-progress': '#64B5F6',
      'ready': '#81C784',
      'completed': '#A5A5A5',
    }[order.status] || '#999';

    const itemsRows = order.items.map((item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0;">${item.name}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; color: #666;">${item.notes || '—'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #2D1B2E;
            padding: 40px;
            background: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 3px solid #E91E63;
          }
          .brand {
            font-size: 28px;
            font-weight: 700;
            color: #E91E63;
            margin-bottom: 4px;
          }
          .order-id {
            font-size: 14px;
            color: #8E4A6B;
          }
          .date-generated {
            font-size: 12px;
            color: #999;
            text-align: right;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            color: #fff;
            font-weight: 600;
            font-size: 13px;
            margin-top: 8px;
          }
          .section {
            margin-bottom: 24px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #E91E63;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .info-item {
            background: #FFF0F5;
            padding: 14px 16px;
            border-radius: 10px;
          }
          .info-label {
            font-size: 11px;
            color: #8E4A6B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 15px;
            font-weight: 500;
            color: #2D1B2E;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid #f0f0f0;
          }
          th {
            background: #FFF0F5;
            padding: 10px 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: #8E4A6B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          th:nth-child(2) { text-align: center; }
          .notes-box {
            background: #FFF0F5;
            padding: 16px;
            border-radius: 10px;
            font-size: 14px;
            line-height: 1.6;
            color: #2D1B2E;
            border-left: 4px solid #E91E63;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #f0f0f0;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
          .payment-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            color: #fff;
            font-weight: 600;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Order Summary</div>
            <div class="order-id">Order #${order.id.slice(-4)}</div>
            <div class="status-badge" style="background: ${statusColor};">${statusLabel}</div>
          </div>
          <div class="date-generated">
            Generated on<br/>
            ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Customer Details</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Name</div>
              <div class="info-value">${order.customerName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Phone</div>
              <div class="info-value">${order.phoneNumber || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Deadline</div>
              <div class="info-value">${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Payment</div>
              <div>
                <span class="payment-badge" style="background: ${order.paid ? '#10B981' : '#F59E0B'};">
                  ${order.paid ? 'Paid' : 'Not Paid'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Order Items</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>

        ${order.specialNotes ? `
        <div class="section">
          <div class="section-title">Special Notes</div>
          <div class="notes-box">${order.specialNotes}</div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Timeline</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Created</div>
              <div class="info-value">${createdAt.toLocaleDateString()} at ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Last Updated</div>
              <div class="info-value">${updatedAt.toLocaleDateString()} at ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          Order #${order.id.slice(-4)} &middot; Generated automatically
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf || !order) return;
    try {
      setIsGeneratingPdf(true);
      console.log('📄 Generating PDF for order:', order.id);

      const html = generateOrderHtml(order);

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        } else {
          Alert.alert('Error', 'Could not open print window. Please allow popups.');
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        console.log('📄 PDF generated at:', uri);

        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Order #${order.id.slice(-4)}`,
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('PDF Generated', 'PDF was created but sharing is not available on this device.');
        }
      }
    } catch (error) {
      console.error('📄 PDF generation error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to generate PDF';
      Alert.alert('Error', msg);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleEditOrder = () => {
    console.log('🔧 Order Detail - Edit button pressed for order:', order.id);
    router.push(`/edit-order/${order.id}` as any);
  };

  const handleDeleteOrder = () => {
    console.log('🔧 Order Detail - Delete button pressed for order:', order.id);
    if (isDeletingOrder) return;
    setShowDeleteModal(true);
  };

  const handleViewRecipe = (itemName: string) => {
    const product = mockProducts.find(p => p.name === itemName);
    if (product && product.recipeId) {
      const recipe = getRecipeById(product.recipeId);
      if (recipe) {
        router.push(`/recipe/${product.recipeId}` as any);
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
            <View>
              <Text style={styles.customerName}>{order.customerName}</Text>
              {order.phoneNumber && (
                <Text style={styles.phoneNumber}>{order.phoneNumber}</Text>
              )}
            </View>
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
                testID={`view-recipe-${item.id}`}
              >
                <FileText size={14} color={Colors.primary} />
                <Text style={styles.recipeButtonText}>View Recipe</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Paid status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <TouchableOpacity
            style={[styles.actionButton, order.paid ? styles.paidButton : styles.unpaidButton]}
            onPress={handleTogglePaid}
            activeOpacity={0.7}
            testID="toggle-paid-button"
          >
            <DollarSign size={20} color={Colors.surface} />
            <Text style={styles.actionButtonText}>{isTogglingPaid ? 'Updating...' : order.paid ? 'Mark as Not Paid' : 'Mark as Paid'}</Text>
          </TouchableOpacity>
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
              style={[styles.actionButton, styles.pdfButton]}
              onPress={handleDownloadPdf}
              activeOpacity={0.7}
              testID="download-pdf-button"
            >
              <Download size={20} color={Colors.surface} />
              <Text style={styles.actionButtonText}>
                {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
              </Text>
            </TouchableOpacity>

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
            <Text style={styles.debugText}>Paid: {order.paid ? 'Yes' : 'No'}</Text>
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
                    router.replace('/');
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
  phoneNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
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
    fontWeight: 500,
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
  pdfButton: {
    backgroundColor: '#0EA5E9',
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
  paidButton: {
    backgroundColor: '#10B981',
  },
  unpaidButton: {
    backgroundColor: '#F59E0B',
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