export interface CartItem {
  productId: number;
  name: string;
  imageUrl: string | null;
  brandName: string;
  unitPrice: number;
  quantity: number;
  stockQuantity: number;
  lineTotal: number;
  /** false لو المنتج اتخفى أو المخزون أقل من الكمية: بيتعرض بس مش بيتحسب في الإجمالي. */
  isAvailable: boolean;
}

export interface Cart {
  items: CartItem[];
  /** مجموع الكميات (اللي بيظهر على أيقونة السلة). */
  itemCount: number;
  subtotal: number;
}

/** أقصى كمية من المنتج الواحد (نفس حد الـ API). */
export const MAX_QUANTITY_PER_ITEM = 10;
