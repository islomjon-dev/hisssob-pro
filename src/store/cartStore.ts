import { create } from 'zustand';
import { CartItem } from '../types';
import { calculateItemTotal } from '../utils/calculations';

interface CartState {
  items: CartItem[];
  discount: number;
  payment: number;
  activeItemId: string | null;
  addItem: (productId: string, productName: string, productImage?: string) => void;
  updatePrice: (productId: string, price: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  setDiscount: (discount: number) => void;
  setPayment: (payment: number) => void;
  setActiveItem: (productId: string | null) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getFinalTotal: () => number;
  getChange: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,
  payment: 0,
  activeItemId: null,

  addItem: (productId, productName, productImage) => {
    const { items } = get();
    const existing = items.find(item => item.productId === productId);
    
    if (existing) {
      // If item already exists, increment quantity
      const newQty = existing.quantity + 1;
      const newItemTotal = existing.salePrice !== null ? calculateItemTotal(newQty, existing.salePrice) : 0;
      set({
        items: items.map(item =>
          item.productId === productId
            ? { ...item, quantity: newQty, itemTotal: newItemTotal }
            : item
        ),
        activeItemId: productId,
      });
    } else {
      // Add new item with null price (user must enter price)
      set({
        items: [...items, {
          productId,
          productName,
          productImage,
          quantity: 1,
          salePrice: null,
          itemTotal: 0,
        }],
        activeItemId: productId,
      });
    }
  },

  updatePrice: (productId, price) => {
    const { items } = get();
    set({
      items: items.map(item =>
        item.productId === productId
          ? { ...item, salePrice: price, itemTotal: calculateItemTotal(item.quantity, price) }
          : item
      ),
    });
  },

  updateQuantity: (productId, quantity) => {
    const { items } = get();
    const qty = Math.max(1, quantity);
    set({
      items: items.map(item =>
        item.productId === productId
          ? { ...item, quantity: qty, itemTotal: item.salePrice !== null ? calculateItemTotal(qty, item.salePrice) : 0 }
          : item
      ),
    });
  },

  removeItem: (productId) => {
    set({ items: get().items.filter(item => item.productId !== productId) });
  },

  setDiscount: (discount) => {
    set({ discount: Math.max(0, discount) });
  },

  setPayment: (payment) => {
    set({ payment: Math.max(0, payment) });
  },

  setActiveItem: (productId) => {
    set({ activeItemId: productId });
  },

  clearCart: () => {
    set({ items: [], discount: 0, payment: 0, activeItemId: null });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.itemTotal, 0);
  },

  getFinalTotal: () => {
    const subtotal = get().getSubtotal();
    return Math.max(0, subtotal - get().discount);
  },

  getChange: () => {
    return get().payment - get().getFinalTotal();
  },
}));
