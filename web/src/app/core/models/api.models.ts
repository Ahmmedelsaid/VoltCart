// أشكال الـ responses بتاعة الـ API (مطابقة للـ DTOs في api/Dtos)

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  brandName: string;
  categoryName: string;
}

export interface ProductDetails {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stockQuantity: number;
  isActive: boolean;
  specs: Record<string, string>;
  categoryName: string;
  brandName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  productCount: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
}

export const PRODUCT_SORTS = ['price_asc', 'price_desc', 'name', 'newest'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export interface ProductQuery {
  search?: string;
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

/** الشكل الموحّد للخطأ بعد ما الـ interceptor يقرا ProblemDetails من الـ API. */
export interface ApiError {
  /** 0 = السيرفر مش متاح (network)، -1 = خطأ غير معروف */
  status: number;
  title: string;
  detail?: string;
  errors?: Record<string, string[]>;
}
