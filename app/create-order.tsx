import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useOrderStore } from '@/stores/order-store';
import { useCustomerStore } from '@/stores/customer-store';
import { useAuthStore } from '@/stores/auth-store';
import { useRecipeStore } from '@/stores/recipe-store';
import { Colors } from '@/constants/colors';
import { OrderItem } from '@/types/order';
import { Customer } from '@/types/customer';
import { Plus, Minus, X, Search, User, ChevronDown, Calendar } from 'lucide-react-native';

export default function CreateOrderScreen() {
  const router = useRouter();
  const { addOrder } = useOrderStore();
  const { customers, loadCustomers } = useCustomerStore();
  const { currentUser } = useAuthStore();
  const { recipes, loadRecipes, isLoading: isLoadingRecipes } = useRecipeStore();
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  // Load customers and recipes when component mounts
  useEffect(() => {
    loadCustomers();
    loadRecipes();
  }, [loadCustomers, loadRecipes]);

  // Ensure recipes are refreshed when opening product picker
  useEffect(() => {
    if (showProductPicker) {
      console.log('🧁 CreateOrder - Refreshing recipes for product picker');
      loadRecipes();
    } else {
      setProductSearchQuery('');
    }
  }, [showProductPicker, loadRecipes]);

  const filteredCustomers = useMemo(() => customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchQuery.toLowerCase())
  ), [customers, customerSearchQuery]);

  const filteredRecipes = useMemo(() => {
    const q = productSearchQuery.trim().toLowerCase();
    const list = [...recipes].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return list;
    return list.filter(r => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
  }, [recipes, productSearchQuery]);

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNewCustomerName('');
    setShowCustomerPicker(false);
    setShowNewCustomerForm(false);
    setCustomerSearchQuery('');
  };

  const handleNewCustomer = () => {
    setSelectedCustomer(null);
    setShowNewCustomerForm(true);
    setShowCustomerPicker(false);
  };

  const handleTimeSelection = (hours: number, minutes: number) => {
    setSelectedHour(hours);
    setSelectedMinute(minutes);
    setShowTimePicker(false);
    
    console.log('📅 Time selected:', {
      year: selectedYear,
      month: selectedMonth,
      day: selectedDay,
      hour: hours,
      minute: minutes,
    });
  };

  const getDeadlineLabel = () => {
    if (selectedYear === null || selectedMonth === null || selectedDay === null || 
        selectedHour === null || selectedMinute === null) {
      return 'Select deadline';
    }
    
    const date = new Date(selectedYear, selectedMonth, selectedDay);
    const ampm = selectedHour >= 12 ? 'PM' : 'AM';
    const displayHour = selectedHour % 12 || 12;
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    return `${date.toLocaleDateString()} at ${displayHour}:${pad(selectedMinute)} ${ampm}`;
  };
  
  const getDeadlineISO = (): string | null => {
    if (selectedYear === null || selectedMonth === null || selectedDay === null || 
        selectedHour === null || selectedMinute === null) {
      return null;
    }
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${selectedYear}-${pad(selectedMonth + 1)}-${pad(selectedDay)}T${pad(selectedHour)}:${pad(selectedMinute)}:00`;
  };

  const handleAddItem = (productId: string, productName: string) => {
    const existingItem = selectedItems.find(item => item.name === productName);
    
    if (existingItem) {
      setSelectedItems(items =>
        items.map(item =>
          item.name === productName
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newItem: OrderItem = {
        id: Date.now().toString(),
        name: productName,
        quantity: 1,
      };
      setSelectedItems(items => [...items, newItem]);
    }
    setShowProductPicker(false);
  };

  const handleUpdateQuantity = (itemId: string, change: number) => {
    setSelectedItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(1, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(items => items.filter(item => item.id !== itemId));
  };

  const handleUpdateItemNotes = (itemId: string, notes: string) => {
    setSelectedItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, notes } : item
      )
    );
  };

  const handleCreateOrder = async () => {
    const customerName = selectedCustomer ? selectedCustomer.name : newCustomerName.trim();
    
    if (!customerName) {
      Alert.alert('Error', 'Please select a customer or enter a new customer name');
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    const deadlineISO = getDeadlineISO();
    if (!deadlineISO) {
      Alert.alert('Error', 'Please select a deadline');
      return;
    }

    setIsCreating(true);

    try {
      console.log('🏗️ Creating order with data:', {
        customerName,
        items: selectedItems,
        deadline: deadlineISO,
        specialNotes: specialNotes.trim() || undefined,
      });

      await addOrder({
        customerName,
        items: selectedItems,
        status: 'pending',
        deadline: deadlineISO,
        specialNotes: specialNotes.trim() || undefined,
      });

      console.log('✅ Order created successfully!');

      // Show success message and navigate back
      Alert.alert(
        'Order Created!', 
        `Order for ${customerName} has been successfully created and added to the kitchen queue.`,
        [
          { 
            text: 'View Orders', 
            onPress: () => {
              router.dismiss();
              router.push('/(tabs)');
            }
          },
          { 
            text: 'Create Another', 
            onPress: () => {
              // Reset form for another order
              setSelectedCustomer(null);
              setNewCustomerName('');
              setSelectedItems([]);
              setSelectedYear(null);
              setSelectedMonth(null);
              setSelectedDay(null);
              setSelectedHour(null);
              setSelectedMinute(null);
              setSpecialNotes('');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Create order error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // Generate date options for the next 30 days
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  // Generate time options
  const generateTimeOptions = () => {
    const times: { hours: number; minutes: number; label: string }[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const displayHour = hour % 12 || 12;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const pad = (n: number) => n.toString().padStart(2, '0');
        const label = `${displayHour}:${pad(minute)} ${ampm}`;
        times.push({ hours: hour, minutes: minute, label });
      }
    }
    
    return times;
  };

  const dateOptions = generateDateOptions();
  const timeOptions = generateTimeOptions();

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Create Order',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }} 
      />

      <View style={styles.content}>
        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Customer *</Text>
          
          {selectedCustomer ? (
            <View style={styles.selectedCustomer}>
              <View style={styles.customerInfo}>
                <User size={20} color={Colors.primary} />
                <View>
                  <Text style={styles.selectedCustomerName}>{selectedCustomer.name}</Text>
                  {selectedCustomer.phone && (
                    <Text style={styles.selectedCustomerDetails}>{selectedCustomer.phone}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : showNewCustomerForm ? (
            <View style={styles.newCustomerForm}>
              <TextInput
                style={styles.input}
                value={newCustomerName}
                onChangeText={setNewCustomerName}
                placeholder="Enter new customer name"
                placeholderTextColor={Colors.textSecondary}
              />
              <TouchableOpacity onPress={() => setShowNewCustomerForm(false)}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.customerButtons}>
              <TouchableOpacity 
                style={styles.customerButton}
                onPress={() => setShowCustomerPicker(true)}
              >
                <Text style={styles.customerButtonText}>Select Existing Customer</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.customerButton}
                onPress={handleNewCustomer}
              >
                <Text style={styles.customerButtonText}>New Customer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Deadline Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Deadline *</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color={Colors.textSecondary} />
            <Text style={[styles.dropdownButtonText, (selectedYear === null || selectedMonth === null || selectedDay === null || selectedHour === null || selectedMinute === null) && styles.placeholderText]}>
              {getDeadlineLabel()}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Order Items *</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowProductPicker(true)}
            >
              <Plus size={16} color={Colors.surface} />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {selectedItems.length === 0 ? (
            <Text style={styles.emptyText}>No items added yet</Text>
          ) : (
            selectedItems.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                    <X size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.quantityControls}>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => handleUpdateQuantity(item.id, -1)}
                  >
                    <Minus size={16} color={Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => handleUpdateQuantity(item.id, 1)}
                  >
                    <Plus size={16} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.notesInput}
                  value={item.notes || ''}
                  onChangeText={(text) => handleUpdateItemNotes(item.id, text)}
                  placeholder="Item notes (optional)"
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                />
              </View>
            ))
          )}
        </View>

        {/* Special Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Special Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={specialNotes}
            onChangeText={setSpecialNotes}
            placeholder="Any special instructions or notes"
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity 
          style={[styles.createButton, isCreating && styles.createButtonDisabled]} 
          onPress={handleCreateOrder}
          disabled={isCreating}
        >
          <Text style={styles.createButtonText}>
            {isCreating ? 'Creating Order...' : 'Create Order'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Customer Picker Modal */}
      {showCustomerPicker && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Customer</Text>
              <TouchableOpacity onPress={() => setShowCustomerPicker(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={customerSearchQuery}
                onChangeText={setCustomerSearchQuery}
                placeholder="Search customers..."
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            
            <ScrollView style={styles.customerList}>
              {filteredCustomers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  style={styles.customerItem}
                  onPress={() => handleSelectCustomer(customer)}
                >
                  <Text style={styles.customerItemName}>{customer.name}</Text>
                  {customer.phone && (
                    <Text style={styles.customerItemDetails}>{customer.phone}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.dateList}>
              {dateOptions.map((date, index) => {
                const isSelected = selectedYear === date.getFullYear() && 
                                   selectedMonth === date.getMonth() && 
                                   selectedDay === date.getDate();
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateItem,
                      isSelected && styles.dateItemSelected
                    ]}
                    onPress={() => {
                      setSelectedYear(date.getFullYear());
                      setSelectedMonth(date.getMonth());
                      setSelectedDay(date.getDate());
                      setShowDatePicker(false);
                      setShowTimePicker(true);
                    }}
                  >
                    <Text style={[
                      styles.dateItemText,
                      isSelected && styles.dateItemTextSelected
                    ]}>
                      {date.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Text>
                    {index === 0 && <Text style={styles.todayLabel}>Today</Text>}
                    {index === 1 && <Text style={styles.todayLabel}>Tomorrow</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.timeList}>
              {timeOptions.map((time, index) => {
                const isSelected = selectedHour === time.hours && selectedMinute === time.minutes;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeItem,
                      isSelected && styles.timeItemSelected
                    ]}
                    onPress={() => handleTimeSelection(time.hours, time.minutes)}
                  >
                    <Text style={[
                      styles.timeItemText,
                      isSelected && styles.timeItemTextSelected
                    ]}>
                      {time.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Product Picker Modal */}
      {showProductPicker && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={productSearchQuery}
                onChangeText={setProductSearchQuery}
                placeholder="Search products..."
                placeholderTextColor={Colors.textSecondary}
                autoFocus
              />
            </View>
            
            <ScrollView style={styles.productList}>
              {isLoadingRecipes ? (
                <View style={styles.emptyProductsContainer}>
                  <Text style={styles.emptyProductsText}>Loading products...</Text>
                </View>
              ) : filteredRecipes.length === 0 ? (
                <View style={styles.emptyProductsContainer}>
                  <Text style={styles.emptyProductsText}>No products found</Text>
                  <Text style={styles.emptyProductsSubtext}>Try a different search or add recipes</Text>
                </View>
              ) : (
                filteredRecipes.map((recipe) => (
                  <TouchableOpacity
                    key={recipe.id}
                    style={styles.productItem}
                    onPress={() => handleAddItem(recipe.id, recipe.name)}
                  >
                    <Text style={styles.productName}>{recipe.name}</Text>
                    <Text style={styles.productCategory}>{recipe.category}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectedCustomer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedCustomerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedCustomerDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  newCustomerForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  customerButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  customerButtonText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: Colors.text,
    minHeight: 40,
  },
  createButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  customerList: {
    maxHeight: 300,
  },
  customerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  customerItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  customerItemDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  dateList: {
    maxHeight: 400,
  },
  dateItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateItemSelected: {
    backgroundColor: Colors.primary + '20',
  },
  dateItemText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  dateItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  todayLabel: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  timeList: {
    maxHeight: 400,
  },
  timeItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timeItemSelected: {
    backgroundColor: Colors.primary + '20',
  },
  timeItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  timeItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  productList: {
    maxHeight: 400,
  },
  productItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  emptyProductsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyProductsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyProductsSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});