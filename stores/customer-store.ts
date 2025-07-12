import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/types/customer';

interface CustomerState {
  customers: Customer[];
  isLoading: boolean;
  
  // Actions
  loadCustomers: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  getCustomerById: (customerId: string) => Customer | undefined;
  searchCustomers: (query: string) => Customer[];
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  isLoading: false,

  loadCustomers: async () => {
    set({ isLoading: true });
    try {
      console.log('👥 Customer store - Loading customers...');
      
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('👥 Customer store - Load customers error:', error);
        console.error('👥 Customer store - Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        set({ isLoading: false });
        return;
      }

      console.log('👥 Customer store - Loaded customers:', customers?.length || 0);

      const formattedCustomers: Customer[] = (customers || []).map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone || undefined,
        email: customer.email || undefined,
        address: customer.address || undefined,
        notes: customer.notes || undefined,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
      }));

      set({ customers: formattedCustomers, isLoading: false });
    } catch (error) {
      console.error('👥 Customer store - Load customers catch error:', error);
      set({ isLoading: false });
    }
  },

  addCustomer: async (customerData) => {
    try {
      console.log('👥 Customer store - Adding customer:', customerData);
      
      // Test database connection first
      const { data: testData, error: testError } = await supabase
        .from('customers')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('👥 Customer store - Database connection test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}. Please make sure you've run the database setup script in your Supabase SQL Editor.`);
      }
      
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: customerData.name,
          phone: customerData.phone || null,
          email: customerData.email || null,
          address: customerData.address || null,
          notes: customerData.notes || null,
        }])
        .select()
        .single();

      if (error) {
        console.error('👥 Customer store - Add customer error:', error);
        console.error('👥 Customer store - Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        if (error.code === '42P01') {
          throw new Error('Database table "customers" does not exist. Please run the database setup script in your Supabase SQL Editor first.');
        }
        
        throw new Error(`Failed to add customer: ${error.message || 'Unknown database error'}`);
      }

      if (!data) {
        throw new Error('No data returned from customer creation');
      }

      const newCustomer: Customer = {
        id: data.id,
        name: data.name,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      set((state) => ({ customers: [newCustomer, ...state.customers] }));
      console.log('👥 Customer store - Customer added successfully:', newCustomer.name);
      return newCustomer;
    } catch (error) {
      console.error('👥 Customer store - Add customer catch error:', error);
      
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unknown error occurred while adding customer: ${JSON.stringify(error)}`);
      }
    }
  },

  updateCustomer: async (customerId, updates) => {
    try {
      console.log('👥 Customer store - Updating customer:', customerId, updates);
      
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone || null;
      if (updates.email !== undefined) dbUpdates.email = updates.email || null;
      if (updates.address !== undefined) dbUpdates.address = updates.address || null;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;

      const { data, error } = await supabase
        .from('customers')
        .update(dbUpdates)
        .eq('id', customerId)
        .select()
        .single();

      if (error) {
        console.error('👥 Customer store - Update customer error:', error);
        console.error('👥 Customer store - Update error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Failed to update customer: ${error.message || 'Unknown database error'}`);
      }

      const updatedCustomer: Customer = {
        id: data.id,
        name: data.name,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      set((state) => ({
        customers: state.customers.map((customer) =>
          customer.id === customerId ? updatedCustomer : customer
        ),
      }));
      
      console.log('👥 Customer store - Customer updated successfully:', updatedCustomer.name);
    } catch (error) {
      console.error('👥 Customer store - Update customer catch error:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unknown error occurred while updating customer: ${JSON.stringify(error)}`);
      }
    }
  },

  deleteCustomer: async (customerId) => {
    try {
      console.log('👥 Customer store - Deleting customer:', customerId);
      
      // Test database connection first
      const { data: testData, error: testError } = await supabase
        .from('customers')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('👥 Customer store - Database connection test failed for delete:', testError);
        throw new Error(`Database connection failed: ${testError.message}. Please make sure you've run the database setup script in your Supabase SQL Editor.`);
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) {
        console.error('👥 Customer store - Delete customer error:', error);
        console.error('👥 Customer store - Delete error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        if (error.code === '42P01') {
          throw new Error('Database table "customers" does not exist. Please run the database setup script in your Supabase SQL Editor first.');
        }
        
        throw new Error(`Failed to delete customer: ${error.message || 'Unknown database error'}`);
      }

      // Remove from local state
      set((state) => ({
        customers: state.customers.filter((customer) => customer.id !== customerId),
      }));
      
      console.log('👥 Customer store - Customer deleted successfully:', customerId);
    } catch (error) {
      console.error('👥 Customer store - Delete customer catch error:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unknown error occurred while deleting customer: ${JSON.stringify(error)}`);
      }
    }
  },

  getCustomerById: (customerId) => {
    return get().customers.find((customer) => customer.id === customerId);
  },

  searchCustomers: (query) => {
    const customers = get().customers;
    if (!query.trim()) return customers;
    
    const searchTerm = query.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm) ||
      customer.phone?.toLowerCase().includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm)
    );
  },
}));