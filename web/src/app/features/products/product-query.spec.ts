import { convertToParamMap } from '@angular/router';
import { PAGE_SIZE, hasActiveFilters, pageWindow, toQuery, toUrlParams } from './product-query';

describe('toQuery', () => {
  it('reads every filter from the URL', () => {
    const query = toQuery(
      convertToParamMap({
        search: ' sony ',
        categoryId: '3',
        brandId: '2',
        minPrice: '1000',
        maxPrice: '20000',
        sort: 'price_desc',
        page: '2',
      }),
    );

    expect(query).toEqual({
      search: 'sony',
      categoryId: 3,
      brandId: 2,
      minPrice: 1000,
      maxPrice: 20000,
      sort: 'price_desc',
      page: 2,
      pageSize: PAGE_SIZE,
    });
  });

  it('ignores invalid values', () => {
    const query = toQuery(
      convertToParamMap({ categoryId: 'abc', minPrice: '', sort: 'hacked', page: '-4' }),
    );

    expect(query.categoryId).toBeUndefined();
    expect(query.minPrice).toBeUndefined();
    expect(query.sort).toBeUndefined();
    expect(query.page).toBe(1);
  });
});

describe('toUrlParams', () => {
  it('omits empty values and the default page', () => {
    expect(toUrlParams({ search: '', page: 1, pageSize: PAGE_SIZE })).toEqual({});
  });

  it('round-trips with toQuery', () => {
    const params = toUrlParams({ search: 'mac', brandId: 4, sort: 'name', page: 3 });
    expect(params).toEqual({ search: 'mac', brandId: 4, sort: 'name', page: 3 });
  });
});

describe('hasActiveFilters', () => {
  it('ignores sort and page', () => {
    expect(hasActiveFilters({ sort: 'name', page: 3 })).toBe(false);
  });

  it('detects any filter', () => {
    expect(hasActiveFilters({ minPrice: 0 })).toBe(true);
    expect(hasActiveFilters({ search: 'x' })).toBe(true);
  });
});

describe('pageWindow', () => {
  it('shows every page when there are few', () => {
    expect(pageWindow(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it('collapses long ranges with gaps', () => {
    expect(pageWindow(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20]);
  });

  it('does not add a gap next to the edges', () => {
    expect(pageWindow(2, 20)).toEqual([1, 2, 3, 'gap', 20]);
    expect(pageWindow(19, 20)).toEqual([1, 'gap', 18, 19, 20]);
  });

  it('handles a single page', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
  });
});
