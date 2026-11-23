import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductsService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('sends only the filters that have a value', () => {
    service
      .list({
        search: 'sony',
        categoryId: undefined,
        brandId: 3,
        minPrice: 0,
        page: 2,
        pageSize: 12,
      })
      .subscribe();

    const request = controller.expectOne((req) => req.url.endsWith('/products'));
    expect(request.request.params.get('search')).toBe('sony');
    expect(request.request.params.get('brandId')).toBe('3');
    expect(request.request.params.get('minPrice')).toBe('0');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.has('categoryId')).toBe(false);
    request.flush({ items: [], totalCount: 0, page: 2, pageSize: 12, totalPages: 0 });
  });

  it('requests a single product by id', () => {
    service.get(7).subscribe();
    const request = controller.expectOne((req) => req.url.endsWith('/products/7'));
    expect(request.request.method).toBe('GET');
    request.flush({});
  });
});
