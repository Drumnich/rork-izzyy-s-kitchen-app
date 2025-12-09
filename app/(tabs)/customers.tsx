import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useCustomerStore } from '@/stores/customer-store';
import { useAuthStore } from '@/stores/auth-store';
import { Colors } from '@/constants/colors';
import { Customer } from '@/types/customer';
import { Plus, Search, User, Phone, Mail, MapPin, Edit3, Trash2 } from 'lucide-react-native';

export default function CustomersScreen() {
  const router = useRouter();
  const { customers, loadCustomers, deleteCustomer, isLoading } = useCustomerStore();
  const { currentUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);

  // Load customers when component mounts
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  if (!currentUser) {
    return null;
  }

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteCustomer = (customer: Customer) => {
    console.log('🗑️ Delete customer button pressed for:', customer.name, customer.id);
    
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer.name}? This action cannot be undone.`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('🗑️ Delete cancelled')
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('🗑️ Delete confirmed for customer:', customer.id);
            setDeletingCustomerId(customer.id);
            
            try {
              await deleteCustomer(customer.id);
              console.log('🗑️ Customer deleted successfully');
              Alert.alert('Success', 'Customer deleted successfully');
            } catch (error) {
              console.error('🗑️ Delete customer error:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to delete customer. Please try again.';
              Alert.alert('Error', errorMessage);
            } finally {
              setDeletingCustomerId(null);
            }
          },
        },
      ]
    );
  };

  const handleCreateCustomer = () => {
    console.log('➕ Create customer button pressed');
    router.push('/create-customer');
  };

  const handleEditCustomer = (customer: Customer) => {
    console.log('✏️ Edit customer button pressed for:', customer.name, customer.id);
    router.push(`/edit-customer/${customer.id}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Customers",
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerRight: () => currentUser.role === 'admin' ? (
            <TouchableOpacity onPress={handleCreateCustomer} style={styles.createCustomerHeaderButton}>
              <Plus size={24} color={Colors.surface} />
              <Text style={styles.createCustomerHeaderButtonText}>Customer</Text>
            </TouchableOpacity>
          ) : null,
        }} 
      />

      <View style={styles.header}>
        <Text style={styles.title}>Customer Database</Text>
        <Text style={styles.subtitle}>
          {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search customers..."
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      {/* Admin Create Customer Button */}
      {currentUser.role === 'admin' && (
        <View style={styles.adminActions}>
          <TouchableOpacity style={styles.createCustomerButton} onPress={handleCreateCustomer}>
            <Plus size={24} color={Colors.surface} />
            <Text style={styles.createCustomerButtonText}>Add New Customer</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : filteredCustomers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No customers found' : 'No customers yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery 
              ? 'Try adjusting your search terms'
              : currentUser.role === 'admin' 
                ? "Use the 'Add New Customer' button above to add your first customer" 
                : "Check back later for new customers"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <View style={styles.customerIcon}>
                  <User size={20} color={Colors.primary} />
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{item.name}</Text>
                  {item.phone && (
                    <View style={styles.contactItem}>
                      <Phone size={14} color={Colors.textSecondary} />
                      <Text style={styles.contactText}>{item.phone}</Text>
                    </View>
                  )}
                  {item.email && (
                    <View style={styles.contactItem}>
                      <Mail size={14} color={Colors.textSecondary} />
                      <Text style={styles.contactText}>{item.email}</Text>
                    </View>
                  )}
                  {item.address && (
                    <View style={styles.contactItem}>
                      <MapPin size={14} color={Colors.textSecondary} />
                      <Text style={styles.contactText}>{item.address}</Text>
                    </View>
                  )}
                </View>
                {currentUser.role === 'admin' && (
                  <View style={styles.customerActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleEditCustomer(item)}
                    >
                      <Edit3 size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.actionButton,
                        deletingCustomerId === item.id && styles.actionButtonDisabled
                      ]}
                      onPress={() => handleDeleteCustomer(item)}
                      disabled={deletingCustomerId === item.id}
                    >
                      <Trash2 
                        size={16} 
                        color={deletingCustomerId === item.id ? Colors.textSecondary : Colors.error} 
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {item.notes && (
                <Text style={styles.customerNotes}>{item.notes}</Text>
              )}
            </View>
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
  createCustomerHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    minHeight: 44,
    minWidth: 120,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  createCustomerHeaderButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  adminActions: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  createCustomerButton: {
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
  createCustomerButtonText: {
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
  customerCard: {
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
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  customerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
    gap: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  customerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  customerNotes: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});