import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = 'https://tnywgwiofmvskychmsce.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRueXdnd2lvZm12c2t5Y2htc2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NDA2NzMsImV4cCI6MjA2NDUxNjY3M30.mRD-V9HgFdOOGHejd-YNPel3QyDVAjxp4hPRW611EVI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          role: 'admin' | 'employee';
          pin: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          role: 'admin' | 'employee';
          pin: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: 'admin' | 'employee';
          pin?: string;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string | null;
          customer_name: string;
          items: any; // JSON
          status: 'pending' | 'in-progress' | 'ready' | 'completed';
          deadline: string;
          special_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          customer_name: string;
          items: any;
          status: 'pending' | 'in-progress' | 'ready' | 'completed';
          deadline: string;
          special_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          customer_name?: string;
          items?: any;
          status?: 'pending' | 'in-progress' | 'ready' | 'completed';
          deadline?: string;
          special_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      recipes: {
        Row: {
          id: string;
          name: string;
          category: 'cookie' | 'cake' | 'other';
          servings: number;
          prep_time: number;
          cook_time: number;
          ingredients: any; // JSON
          instructions: any; // JSON
          image: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: 'cookie' | 'cake' | 'other';
          servings: number;
          prep_time: number;
          cook_time: number;
          ingredients: any;
          instructions: any;
          image?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: 'cookie' | 'cake' | 'other';
          servings?: number;
          prep_time?: number;
          cook_time?: number;
          ingredients?: any;
          instructions?: any;
          image?: string | null;
          created_at?: string;
        };
      };
    };
  };
}