import { CartItem } from '../types';

export function calculateItemTotal(quantity: number, salePrice: number): number {
  if (quantity <= 0 || salePrice < 0) return 0;
  return Math.round(quantity * salePrice);
}

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.itemTotal, 0);
}

export function validateDiscount(subtotal: number, discount: number): { valid: boolean; error?: string } {
  if (discount < 0) return { valid: false, error: "Skidka manfiy bo'lishi mumkin emas" };
  if (discount > subtotal) return { valid: false, error: "Skidka jami summadan katta bo'lishi mumkin emas" };
  return { valid: true };
}

export function calculateFinalTotal(subtotal: number, discount: number): number {
  return Math.max(0, subtotal - discount);
}

export function calculateChange(payment: number, finalTotal: number): number {
  return payment - finalTotal;
}

export function validateSale(items: CartItem[], discount: number, payment: number, finalTotal: number): { valid: boolean; error?: string } {
  if (items.length === 0) return { valid: false, error: "Kamida 1 mahsulot qo'shing" };
  
  for (const item of items) {
    if (item.salePrice === null || item.salePrice === undefined) {
      return { valid: false, error: `"${item.productName}" uchun narx kiriting` };
    }
    if (item.salePrice <= 0) {
      return { valid: false, error: `"${item.productName}" narxi 0 dan katta bo'lishi kerak` };
    }
    if (item.quantity <= 0) {
      return { valid: false, error: `"${item.productName}" miqdori 0 dan katta bo'lishi kerak` };
    }
  }

  const discountValidation = validateDiscount(calculateSubtotal(items), discount);
  if (!discountValidation.valid) return discountValidation;

  if (payment < finalTotal) return { valid: false, error: "To'lov yetarli emas" };

  return { valid: true };
}
