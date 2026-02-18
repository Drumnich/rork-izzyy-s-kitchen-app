import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types/order';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  createdAt: string;
}

interface AuthState {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  loadUsers: () => Promise<void>;
  createUser: (name: string, role: UserRole, pin: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getUserById: (userId: string) => User | undefined;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // CRITICAL: Ensure initial state is always unauthenticated
  currentUser: null,
  users: [],
  isAuthenticated: false,
  isLoading: false,

  login: async (pin: string) => {
    console.log('🔐 Auth store - Login attempt with PIN:', pin);
    set({ isLoading: true });
    
    try {
      console.log('🔐 Auth store - Querying database...');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Login timeout')), 3000);
      });
      
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('pin', pin)
        .single();
      
      const { data: users, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      console.log('🔐 Auth store - Database response received');

      if (error) {
        console.log('🔐 Auth store - Database query error:', error.message);
        console.log('🔐 Auth store - Error details:', error);
        set({ isLoading: false });
        return false;
      }

      if (users) {
        const user: User = {
          id: users.id,
          name: users.name,
          role: users.role as UserRole,
          pin: users.pin,
          createdAt: users.created_at,
        };

        console.log('🔐 Auth store - Database login successful:', user.name, user.role);
        set({ 
          currentUser: user, 
          isAuthenticated: true,
          isLoading: false
        });
        return true;
      }

      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('🔐 Auth store - Login error:', error);
      set({ isLoading: false });
      return false;
    }
  },

  logout: () => {
    console.log('🔐 Auth store - Logging out user');
    // CRITICAL: Ensure complete logout and force reset
    set({ 
      currentUser: null, 
      isAuthenticated: false,
      isLoading: false
    });
    
    // Force a complete state reset
    setTimeout(() => {
      set({ 
        currentUser: null, 
        isAuthenticated: false,
        isLoading: false
      });
    }, 50);
  },

  loadUsers: async () => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('🔐 Auth store - Load users error:', error);
        return;
      }

      const formattedUsers: User[] = users.map(user => ({
        id: user.id,
        name: user.name,
        role: user.role as UserRole,
        pin: user.pin,
        createdAt: user.created_at,
      }));

      set({ users: formattedUsers });
    } catch (error) {
      console.error('🔐 Auth store - Load users error:', error);
    }
  },

  createUser: async (name: string, role: UserRole, pin: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ name, role, pin }])
        .select()
        .single();

      if (error) {
        console.error('🔐 Auth store - Create user error:', error);
        throw error;
      }

      const newUser: User = {
        id: data.id,
        name: data.name,
        role: data.role as UserRole,
        pin: data.pin,
        createdAt: data.created_at,
      };

      set((state) => ({ users: [...state.users, newUser] }));
      console.log('🔐 Auth store - Created new user:', { name, role, pin });
    } catch (error) {
      console.error('🔐 Auth store - Create user error:', error);
      throw error;
    }
  },

  updateUser: async (userId: string, updates: Partial<User>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.role) dbUpdates.role = updates.role;
      if (updates.pin) dbUpdates.pin = updates.pin;

      const { data, error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('🔐 Auth store - Update user error:', error);
        throw error;
      }

      const updatedUser: User = {
        id: data.id,
        name: data.name,
        role: data.role as UserRole,
        pin: data.pin,
        createdAt: data.created_at,
      };

      set((state) => ({
        users: state.users.map((user) =>
          user.id === userId ? updatedUser : user
        ),
        currentUser: state.currentUser?.id === userId 
          ? updatedUser 
          : state.currentUser,
      }));
      console.log('🔐 Auth store - Updated user:', userId, updates);
    } catch (error) {
      console.error('🔐 Auth store - Update user error:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('🔐 Auth store - Delete user error:', error);
        throw error;
      }

      set((state) => ({
        users: state.users.filter((user) => user.id !== userId),
        currentUser: state.currentUser?.id === userId ? null : state.currentUser,
        isAuthenticated: state.currentUser?.id === userId ? false : state.isAuthenticated,
      }));
      console.log('🔐 Auth store - Deleted user:', userId);
    } catch (error) {
      console.error('🔐 Auth store - Delete user error:', error);
      throw error;
    }
  },

  getUserById: (userId: string) => {
    return get().users.find((user) => user.id === userId);
  },
}));