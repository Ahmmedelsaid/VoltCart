export type OrderStatus = 'Placed' | 'Cancelled';

export interface OrderItem {
  productId: number;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
  cancelledAt: string | null;
  shippingName: string;
  phone: string;
  address: string;
  city: string;
  notes: string | null;
  items: OrderItem[];
}

/** صف في سجل الطلبات: صور مصغّرة بدل كل المنتجات. */
export interface OrderSummary {
  id: number;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
  imageUrls: string[];
}

export interface PlaceOrderRequest {
  shippingName: string;
  phone: string;
  address: string;
  city: string;
  notes: string | null;
}

/** نفس شكل رقم التليفون المقبول في الـ API. */
export const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,18}[0-9]$/;
