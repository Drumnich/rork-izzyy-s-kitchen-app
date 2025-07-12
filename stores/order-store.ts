import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus } from '@/types/order';

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  
  // Actions
  loadOrders: () => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  isLoading: false,

  loadOrders: async () => {
    set({ isLoading: true });
    try {
      console.log('📋 Order store - Loading orders...');
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('📋 Order store - Load orders error:', error);
        console.error('📋 Order store - Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        set({ isLoading: false });
        return;
      }

      console.log('📋 Order store - Loaded orders:', orders?.length || 0);

      const formattedOrders: Order[] = (orders || []).map(order => ({
        id: order.id,
        customerName: order.customer_name,
        items: order.items,
        status: order.status as OrderStatus,
        deadline: order.deadline,
        specialNotes: order.special_notes || undefined,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      }));

      set({ orders: formattedOrders, isLoading: false });
    } catch (error) {
      console.error('📋 Order store - Load orders catch error:', error);
      set({ isLoading: false });
    }
  },

  addOrder: async (orderData) => {
    try {
      console.log('📋 Order store - Adding order:', orderData);
      
      // Test database connection first
      const { data: testData, error: testError } = await supabase
        .from('orders')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('📋 Order store - Database connection test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}. Please make sure you've run the database setup script in your Supabase SQL Editor.`);
      }
      
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          customer_name: orderData.customerName,
          items: orderData.items,
          status: orderData.status,
          deadline: orderData.deadline,
          special_notes: orderData.specialNotes || null,
        }])
        .select()
        .single();

      if (error) {
        console.error('📋 Order store - Add order error:', error);
        console.error('📋 Order store - Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        if (error.code === '42P01') {
          throw new Error('Database table "orders" does not exist. Please run the database setup script in your Supabase SQL Editor first.');
        }
        
        throw new Error(`Failed to add order: ${error.message || 'Unknown database error'}`);
      }

      const newOrder: Order = {
        id: data.id,
        customerName: data.customer_name,
        items: data.items,
        status: data.status as OrderStatus,
        deadline: data.deadline,
        specialNotes: data.special_notes || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      set((state) => ({ orders: [newOrder, ...state.orders] }));
      console.log('📋 Order store - Order added successfully');
    } catch (error) {
      console.error('📋 Order store - Add order catch error:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unknown error occurred while adding order: ${JSON.stringify(error)}`);
      }
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('📋 Order store - Update order status error:', error);
        throw new Error(`Failed to update order status: ${error.message || 'Unknown database error'}`);
      }

      const updatedOrder: Order = {
        id: data.id,
        customerName: data.customer_name,
        items: data.items,
        status: data.status as OrderStatus,
        deadline: data.deadline,
        specialNotes: data.special_notes || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? updatedOrder : order
        ),
      }));
    } catch (error) {
      console.error('📋 Order store - Update order status error:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unknown error occurred while updating order status: ${JSON.stringify(error)}`);
      }
    }
  },

  updateOrder: async (orderId, updates) => {
    try {
      const dbUpdates: any = {};
      if (updates.customerName) dbUpdates.customer_name = updates.customerName;
      if (updates.items) dbUpdates.items = updates.items;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.deadline) dbUpdates.deadline = updates.deadline;
      if (updates.specialNotes !== undefined) dbUpdates.special_notes = updates.specialNotes || null;

      const { data, error } = await supabase
        .from('orders')
        .update(dbUpdates)
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('📋 Order store - Update order error:', error);
        throw new Error(`Failed to update order: ${error.message || 'Unknown database error'}`);
      }

      const updatedOrder: Order = {
        id: data.id,
        customerName: data.customer_name,
        items: data.items,
        status: data.status as OrderStatus,
        deadline: data.deadline,
        specialNotes: data.special_notes || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? updatedOrder : order
        ),
      }));
    } catch (error) {
      console.error('📋 Order store - Update order error:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unknown error occurred while updating order: ${JSON.stringify(error)}`);
      }
    }
  },

  deleteOrder: async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('📋 Order store - Delete order error:', error);
        throw new Error(`Failed to delete order: ${error.message || 'Unknown database error'}`);
      }

      set((state) => ({
        orders: state.orders.filter((order) => order.id !== orderId),
      }));
    } catch (error) {
      console.error('📋 Order store - Delete order error:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unknown error occurred while deleting order: ${JSON.stringify(error)}`);
      }
    }
  },

  getOrderById: (orderId) => {
    return get().orders.find((order) => order.id === orderId);
  },

  getOrdersByStatus: (status) => {
    return get().orders.filter((order) => order.status === status);
  },
}));