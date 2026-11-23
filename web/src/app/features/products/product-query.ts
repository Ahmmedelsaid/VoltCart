import { Params, ParamMap } from '@angular/router';
import { PRODUCT_SORTS, ProductQuery, ProductSort } from '../../core/models/api.models';

export const PAGE_SIZE = 12;

export function isProductSort(value: string | null): value is ProductSort {
  return PRODUCT_SORTS.includes(value as ProductSort);
}

/** الـ URL هو مصدر الحقيقة للفلاتر: بنقراها من الـ query params. */
export function toQuery(params: ParamMap): ProductQuery {
  const number = (key: string): number | undefined => {
    const raw = params.get(key);
    if (raw === null || raw.trim() === '') return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  };

  const sort = params.get('sort');
  const page = number('page');

  return {
    search: params.get('search')?.trim() || undefined,
    categoryId: number('categoryId'),
    brandId: number('brandId'),
    minPrice: number('minPrice'),
    maxPrice: number('maxPrice'),
    sort: isProductSort(sort) ? sort : undefined,
    page: page && page >= 1 ? Math.floor(page) : 1,
    pageSize: PAGE_SIZE,
  };
}

/** عكس toQuery: بيكتب الفلاتر في الـ URL وبيشيل القيم الفاضية والافتراضية. */
export function toUrlParams(query: ProductQuery): Params {
  const params: Params = {};
  if (query.search) params['search'] = query.search;
  if (query.categoryId !== undefined) params['categoryId'] = query.categoryId;
  if (query.brandId !== undefined) params['brandId'] = query.brandId;
  if (query.minPrice !== undefined) params['minPrice'] = query.minPrice;
  if (query.maxPrice !== undefined) params['maxPrice'] = query.maxPrice;
  if (query.sort) params['sort'] = query.sort;
  if (query.page && query.page > 1) params['page'] = query.page;
  return params;
}

export function hasActiveFilters(query: ProductQuery): boolean {
  return (
    !!query.search ||
    query.categoryId !== undefined ||
    query.brandId !== undefined ||
    query.minPrice !== undefined ||
    query.maxPrice !== undefined
  );
}

export type PageItem = number | 'gap';

/** 1 ... 4 5 6 ... 20: الأولى والأخيرة والحالية وجيرانها، وبينهم 'gap'. */
export function pageWindow(current: number, total: number): PageItem[] {
  const pages = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const items: PageItem[] = [];
  for (const page of pages) {
    const previous = items.at(-1);
    if (typeof previous === 'number' && page - previous > 1) items.push('gap');
    items.push(page);
  }
  return items;
}
