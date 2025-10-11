export type OrderStatus = 'pending' | 'in-progress' | 'ready' | 'completed';

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
};

export type Order = {
  id: string;
  customerName: string;
  items: OrderItem[];
  status: OrderStatus;
  deadline: string;
  specialNotes?: string;
  createdAt: string;
  updatedAt: string;
  paid: boolean;
};

export type Recipe = {
  id: string;
  name: string;
  category: 'cookie' | 'cake' | 'other';
  servings: number;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  ingredients: {
    name: string;
    amount: string;
    unit: string;
  }[];
  instructions: string[];
  image?: string;
};

export type UserRole = 'admin' | 'employee';