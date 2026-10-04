export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  image?: string;
  unit: string;
  barcode?: string;
  categoryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  userId: string;
  saleNumber: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  finalTotal: number;
  payment: number;
  change: number;
  createdAt: Date;
}

export interface SaleItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  quantity: number;
  salePrice: number;
  itemTotal: number;
}

export interface Settings {
  id: string;
  userId: string;
  language: 'uz' | 'ru' | 'en';
  theme: 'light' | 'dark';
  currency: string;
  dateFormat: string;
  numberFormat: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  salePrice: number | null;
  itemTotal: number;
}
