import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import { useOrderStore } from '@/stores/order-store';
import { Colors } from '@/constants/colors';
import { Order } from '@/types/order';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Package,
  User,
  Phone,
  FileText,
  CheckCircle,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function generateBatchHtml(orders: Order[], dateLabel: string): string {
  const statusLabel: Record<string, string> = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    ready: 'Ready',
    completed: 'Completed',
  };
  const statusColor: Record<string, string> = {
    pending: '#FFB74D',
    'in-progress': '#64B5F6',
    ready: '#81C784',
    completed: '#A5A5A5',
  };

  const ordersHtml = orders
    .map((order, idx) => {
      const deadline = new Date(order.deadline);
      const itemsRows = order.items
        .map(
          (item) => `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0;">${item.name}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; text-align: center; font-weight: 600;">${item.quantity}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; color: #666; font-size: 12px;">${item.notes || '—'}</td>
        </tr>`
        )
        .join('');

      return `
      <div class="order-card" style="${idx > 0 ? 'page-break-before: auto;' : ''}">
        <div class="order-header">
          <div class="order-number">Order #${order.id.slice(-4)}</div>
          <span class="status" style="background: ${statusColor[order.status] || '#999'};">
            ${statusLabel[order.status] || order.status}
          </span>
        </div>

        <div class="customer-row">
          <div class="customer-detail">
            <span class="label">Customer</span>
            <span class="value">${order.customerName}</span>
          </div>
          <div class="customer-detail">
            <span class="label">Phone</span>
            <span class="value">${order.phoneNumber || 'N/A'}</span>
          </div>
          <div class="customer-detail">
            <span class="label">Deadline</span>
            <span class="value">${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="customer-detail">
            <span class="label">Payment</span>
            <span class="payment-badge" style="background: ${order.paid ? '#10B981' : '#F59E0B'};">
              ${order.paid ? 'Paid' : 'Not Paid'}
            </span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        ${
          order.specialNotes
            ? `<div class="special-notes"><strong>Special Notes:</strong> ${order.specialNotes}</div>`
            : ''
        }
      </div>`;
    })
    .join('');

  const totalItems = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #2D1B2E;
      padding: 30px;
      background: #fff;
    }
    .page-header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #E91E63;
    }
    .page-header h1 {
      font-size: 24px;
      color: #E91E63;
      margin-bottom: 4px;
    }
    .page-header .subtitle {
      font-size: 16px;
      color: #8E4A6B;
      margin-bottom: 6px;
    }
    .page-header .summary {
      font-size: 13px;
      color: #999;
    }
    .order-card {
      border: 1px solid #eee;
      border-radius: 10px;
      padding: 18px;
      margin-bottom: 20px;
      background: #FAFAFA;
    }
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .order-number {
      font-size: 18px;
      font-weight: 700;
      color: #2D1B2E;
    }
    .status {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 16px;
      color: #fff;
      font-weight: 600;
      font-size: 12px;
    }
    .customer-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }
    .customer-detail {
      display: flex;
      flex-direction: column;
    }
    .customer-detail .label {
      font-size: 10px;
      color: #8E4A6B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .customer-detail .value {
      font-size: 13px;
      font-weight: 500;
      color: #2D1B2E;
    }
    .payment-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      color: #fff;
      font-weight: 600;
      font-size: 11px;
      width: fit-content;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #f0f0f0;
      margin-bottom: 10px;
    }
    th {
      background: #FFF0F5;
      padding: 8px 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      color: #8E4A6B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .special-notes {
      background: #FFF0F5;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.5;
      color: #2D1B2E;
      border-left: 3px solid #E91E63;
    }
    .footer {
      margin-top: 30px;
      padding-top: 14px;
      border-top: 1px solid #f0f0f0;
      text-align: center;
      font-size: 11px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="page-header">
    <h1>Orders for ${dateLabel}</h1>
    <div class="subtitle">${orders.length} order${orders.length !== 1 ? 's' : ''} &middot; ${totalItems} total items</div>
    <div class="summary">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
  </div>

  ${ordersHtml}

  <div class="footer">
    Batch Print &middot; ${orders.length} order${orders.length !== 1 ? 's' : ''} &middot; Generated automatically
  </div>
</body>
</html>`;
}

export default function BatchPrintScreen() {
  const { orders } = useOrderStore();
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());

  const ordersForDate = useMemo(() => {
    return orders
      .filter((order) => {
        const deadline = new Date(order.deadline);
        return isSameDay(deadline, selectedDate);
      })
      .sort(
        (a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
  }, [orders, selectedDate]);

  const datesWithOrders = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((order) => {
      const d = new Date(order.deadline);
      set.add(formatDateKey(d));
    });
    return set;
  }, [orders]);

  const goToPrevDay = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const handlePrintAll = useCallback(async () => {
    if (isPrinting || ordersForDate.length === 0) return;

    try {
      setIsPrinting(true);
      console.log('🖨️ Batch Print - Generating PDF for', ordersForDate.length, 'orders');

      const dateLabel = formatDateLabel(selectedDate);
      const html = generateBatchHtml(ordersForDate, dateLabel);

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
        console.log('🖨️ Batch Print - PDF generated at:', uri);

        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Orders for ${formatDateLabel(selectedDate)}`,
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('PDF Generated', 'PDF was created but sharing is not available on this device.');
        }
      }
    } catch (error) {
      console.error('🖨️ Batch Print - Error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to generate PDF';
      Alert.alert('Error', msg);
    } finally {
      setIsPrinting(false);
    }
  }, [isPrinting, ordersForDate, selectedDate]);

  const isToday = isSameDay(selectedDate, new Date());

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days: Array<{ date: Date | null; key: string }> = [];

    for (let i = 0; i < startPad; i++) {
      days.push({ date: null, key: `pad-${i}` });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({ date, key: formatDateKey(date) });
    }
    return days;
  }, [calendarMonth]);

  const handleCalendarSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowCalendarModal(false);
  }, []);

  const prevMonth = useCallback(() => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const statusColor: Record<string, string> = {
    pending: '#FFB74D',
    'in-progress': '#64B5F6',
    ready: '#81C784',
    completed: '#A5A5A5',
  };

  const statusLabel: Record<string, string> = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    ready: 'Ready',
    completed: 'Completed',
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Batch Print Orders',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }}
      />

      <View style={styles.dateNav}>
        <TouchableOpacity onPress={goToPrevDay} style={styles.navArrow} testID="prev-day">
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateCenter}
          onPress={() => {
            setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
            setShowCalendarModal(true);
          }}
          testID="open-calendar"
        >
          <Calendar size={18} color={Colors.primary} />
          <Text style={styles.dateText}>{formatDateLabel(selectedDate)}</Text>
          {isToday && <View style={styles.todayDot} />}
        </TouchableOpacity>

        <TouchableOpacity onPress={goToNextDay} style={styles.navArrow} testID="next-day">
          <ChevronRight size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {!isToday && (
        <TouchableOpacity style={styles.todayButton} onPress={goToToday} testID="go-today">
          <Text style={styles.todayButtonText}>Go to Today</Text>
        </TouchableOpacity>
      )}

      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{ordersForDate.length}</Text>
          <Text style={styles.summaryLabel}>Orders</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {ordersForDate.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0)}
          </Text>
          <Text style={styles.summaryLabel}>Total Items</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {ordersForDate.filter((o) => o.paid).length}
          </Text>
          <Text style={styles.summaryLabel}>Paid</Text>
        </View>
      </View>

      {ordersForDate.length > 0 && (
        <TouchableOpacity
          style={[styles.printAllButton, isPrinting && styles.printAllButtonDisabled]}
          onPress={handlePrintAll}
          activeOpacity={0.7}
          testID="print-all-button"
        >
          <Printer size={22} color="#fff" />
          <Text style={styles.printAllText}>
            {isPrinting
              ? 'Generating PDF...'
              : `Print All ${ordersForDate.length} Order${ordersForDate.length !== 1 ? 's' : ''}`}
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {ordersForDate.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No orders for this day</Text>
            <Text style={styles.emptySubtitle}>
              Try selecting another date or use the calendar
            </Text>
          </View>
        ) : (
          ordersForDate.map((order) => {
            const deadline = new Date(order.deadline);
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>#{order.id.slice(-4)}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusColor[order.status] || '#999' },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {statusLabel[order.status] || order.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <User size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{order.customerName}</Text>
                  </View>
                  {order.phoneNumber ? (
                    <View style={styles.detailRow}>
                      <Phone size={14} color={Colors.textSecondary} />
                      <Text style={styles.detailText}>{order.phoneNumber}</Text>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <Calendar size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>
                      {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {order.paid && (
                    <View style={styles.detailRow}>
                      <CheckCircle size={14} color="#10B981" />
                      <Text style={[styles.detailText, { color: '#10B981' }]}>Paid</Text>
                    </View>
                  )}
                </View>

                <View style={styles.itemsList}>
                  {order.items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={styles.itemQtyBadge}>
                        <Text style={styles.itemQtyText}>{item.quantity}</Text>
                      </View>
                      <Text style={styles.itemName}>{item.name}</Text>
                    </View>
                  ))}
                </View>

                {order.specialNotes ? (
                  <View style={styles.notesRow}>
                    <FileText size={14} color={Colors.primary} />
                    <Text style={styles.notesText} numberOfLines={2}>
                      {order.specialNotes}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={prevMonth} testID="cal-prev-month">
                <ChevronLeft size={22} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={nextMonth} testID="cal-next-month">
                <ChevronRight size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <Text key={i} style={styles.weekDayLabel}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((item) => {
                if (!item.date) {
                  return <View key={item.key} style={styles.calendarCell} />;
                }
                const isSelected = isSameDay(item.date, selectedDate);
                const hasOrders = datesWithOrders.has(formatDateKey(item.date));
                const isTodayCell = isSameDay(item.date, new Date());

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.calendarCell,
                      isSelected && styles.calendarCellSelected,
                      isTodayCell && !isSelected && styles.calendarCellToday,
                    ]}
                    onPress={() => handleCalendarSelect(item.date!)}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                      ]}
                    >
                      {item.date.getDate()}
                    </Text>
                    {hasOrders && (
                      <View
                        style={[
                          styles.orderDot,
                          isSelected && styles.orderDotSelected,
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.calendarCloseBtn}
              onPress={() => setShowCalendarModal(false)}
              testID="close-calendar"
            >
              <Text style={styles.calendarCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  todayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  todayButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  printAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#0EA5E9',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  printAllButtonDisabled: {
    opacity: 0.6,
  },
  printAllText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  list: {
    flex: 1,
    marginTop: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  orderDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  itemsList: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.background,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  itemQtyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemQtyText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  notesText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarMonthText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCellSelected: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  calendarCellToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '700' as const,
  },
  orderDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
  orderDotSelected: {
    backgroundColor: '#fff',
  },
  calendarCloseBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  calendarCloseBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
