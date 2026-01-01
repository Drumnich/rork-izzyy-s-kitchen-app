import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus } from '@/types/order';

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  paidSupported: boolean;
  realtimeSubscribed: boolean;
  
  // Actions
  loadOrders: () => Promise<void>;
  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'paid'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>;
  updateOrderPaid: (orderId: string, paid: boolean) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
}

// Helper to format database row to Order
const formatOrder = (data: any): Order => ({
  id: data.id,
  customerName: data.customer_name,
  phoneNumber: data.phone_number || undefined,
  items: data.items,
  status: data.status as OrderStatus,
  deadline: data.deadline,
  specialNotes: data.special_notes || undefined,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  paid: Boolean(data?.paid) || false,
});

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  isLoading: false,
  paidSupported: false,
  realtimeSubscribed: false,

  loadOrders: async () => {
    set({ isLoading: true });
    try {
      console.log('📋 Order store - Loading orders...');
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
      });
      
      const queryPromise = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: orders, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('📋 Order store - Load orders error:', JSON.stringify(error, null, 2));
        console.error('📋 Order store - Error details:', JSON.stringify({
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }, null, 2));
        set({ isLoading: false });
        return;
      }

      console.log('📋 Order store - Loaded orders:', orders?.length || 0);

      const formattedOrders: Order[] = (orders || []).map(formatOrder);

      // Probe if 'paid' column exists
      let paidSupported = true;
      try {
        const probe = await supabase.from('orders').select('paid').limit(1);
        if (probe.error && probe.error.code === 'PGRST204' && (probe.error.message ?? '').includes("'paid'")) {
          paidSupported = false;
          console.warn('📋 Order store - Paid column not found, disabling paid updates');
        }
      } catch (e) {
        console.warn('📋 Order store - Paid column probe failed', e);
      }

      set({ orders: formattedOrders, isLoading: false, paidSupported });
      
      // Auto-subscribe to realtime after loading orders
      if (!get().realtimeSubscribed) {
        get().subscribeToRealtime();
      }
    } catch (error) {
      console.error('📋 Order store - Load orders catch error:', JSON.stringify(error, null, 2));
      set({ isLoading: false });
    }
  },

  subscribeToRealtime: () => {
    if (get().realtimeSubscribed || realtimeChannel) {
      console.log('📋 Order store - Already subscribed to realtime');
      return;
    }

    console.log('📋 Order store - Subscribing to realtime updates...');
    
    realtimeChannel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('📋 Order store - Realtime INSERT received:', payload.new.id);
          const newOrder = formatOrder(payload.new);
          const existingOrders = get().orders;
          // Check if order already exists (avoid duplicates from local add)
          if (!existingOrders.find(o => o.id === newOrder.id)) {
            set({ orders: [newOrder, ...existingOrders] });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('📋 Order store - Realtime UPDATE received:', payload.new.id);
          const updatedOrder = formatOrder(payload.new);
          set((state) => ({
            orders: state.orders.map((order) =>
              order.id === updatedOrder.id ? updatedOrder : order
            ),
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('📋 Order store - Realtime DELETE received:', payload.old.id);
          set((state) => ({
            orders: state.orders.filter((order) => order.id !== payload.old.id),
          }));
        }
      )
      .subscribe((status) => {
        console.log('📋 Order store - Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          set({ realtimeSubscribed: true });
        }
      });
  },

  unsubscribeFromRealtime: () => {
    if (realtimeChannel) {
      console.log('📋 Order store - Unsubscribing from realtime...');
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
      set({ realtimeSubscribed: false });
    }
  },

  addOrder: async (orderData) => {
    try {
      console.log('📋 Order store - Adding order:', orderData);
      
      // Test database connection first
      const { error: testError } = await supabase
        .from('orders')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('📋 Order store - Database connection test failed:', JSON.stringify(testError, null, 2));
        throw new Error(`Database connection failed: ${testError.message}. Please make sure you've run the database setup script in your Supabase SQL Editor.`);
      }
      
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          customer_name: orderData.customerName,
          phone_number: orderData.phoneNumber || null,
          items: orderData.items,
          status: orderData.status,
          deadline: orderData.deadline,
          special_notes: orderData.specialNotes || null
        }])
        .select()
        .single();

      if (error) {
        console.error('📋 Order store - Add order error:', JSON.stringify(error, null, 2));
        console.error('📋 Order store - Error details:', JSON.stringify({
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }, null, 2));
        
        if (error.code === '42P01') {
          throw new Error('Database table "orders" does not exist. Please run the database setup script in your Supabase SQL Editor first.');
        }
        
        if (error.code === 'PGRST204' && error.message?.includes("'paid'")) {
          console.warn('📋 Order store - Paid column missing; proceeding without paid field');
        } else {
          throw new Error(`Failed to add order: ${error.message || 'Unknown database error'}`);
        }
      }

      const newOrder = formatOrder(data);

      // Add locally only if not already added by realtime
      const existingOrders = get().orders;
      if (!existingOrders.find(o => o.id === newOrder.id)) {
        set((state) => ({ orders: [newOrder, ...state.orders] }));
      }
      console.log('📋 Order store - Order added successfully');
    } catch (error) {
      console.error('📋 Order store - Add order catch error:', JSON.stringify(error, null, 2));
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
        console.error('📋 Order store - Update order status error:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to update order status: ${error.message || 'Unknown database error'}`);
      }

      const updatedOrder = formatOrder(data);

      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? updatedOrder : order
        ),
      }));
    } catch (error) {
      console.error('📋 Order store - Update order status error:', JSON.stringify(error, null, 2));
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unknown error occurred while updating order status: ${JSON.stringify(error)}`);
      }
    }
  },

  updateOrder: async (orderId, updates) => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.customerName) dbUpdates.customer_name = updates.customerName;
      if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber || null;
      if (updates.items) dbUpdates.items = updates.items;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.deadline) dbUpdates.deadline = updates.deadline;
      if (updates.specialNotes !== undefined) dbUpdates.special_notes = updates.specialNotes || null;
      if (updates.paid !== undefined && get().paidSupported) dbUpdates.paid = updates.paid;

      const { data, error } = await supabase
        .from('orders')
        .update(dbUpdates)
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('📋 Order store - Update order error:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to update order: ${error.message || 'Unknown database error'}`);
      }

      const updatedOrder = formatOrder(data);

      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? updatedOrder : order
        ),
      }));
    } catch (error) {
      console.error('📋 Order store - Update order error:', JSON.stringify(error, null, 2));
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unknown error occurred while updating order: ${JSON.stringify(error)}`);
      }
    }
  },

  updateOrderPaid: async (orderId, paid) => {
    try {
      if (!get().paidSupported) {
        console.warn('📋 Order store - Paid column unsupported; updating local state only');
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, paid } : order
          ),
        }));
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .update({ paid })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST204' && (error.message ?? '').includes("'paid'")) {
          console.warn('📋 Order store - Paid column missing on backend; falling back to local update');
          set({ paidSupported: false });
          set((state) => ({
            orders: state.orders.map((order) =>
              order.id === orderId ? { ...order, paid } : order
            ),
          }));
          return;
        }
        console.error('📋 Order store - Update paid error:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to update paid status: ${error.message || 'Unknown database error'}`);
      }

      const updatedOrder = formatOrder(data);

      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? updatedOrder : order
        ),
      }));
    } catch (error) {
      console.error('📋 Order store - Update paid catch error:', JSON.stringify(error, null, 2));
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unknown error occurred while updating paid status: ${JSON.stringify(error)}`);
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
        console.error('📋 Order store - Delete order error:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to delete order: ${error.message || 'Unknown database error'}`);
      }

      set((state) => ({
        orders: state.orders.filter((order) => order.id !== orderId),
      }));
    } catch (error) {
      console.error('📋 Order store - Delete order error:', JSON.stringify(error, null, 2));
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