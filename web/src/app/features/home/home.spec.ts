import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco, TranslocoLoader } from '@jsverse/transloco';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, ProductListItem } from '../../core/models/api.models';
import { Home } from './home';

class EmptyLoader implements TranslocoLoader {
  getTranslation() {
    return of({});
  }
}

const API = environment.apiUrl;

const category = (id: number, name: string, parentId: number | null): Category => ({
  id,
  name,
  slug: name.toLowerCase(),
  description: null,
  imageUrl: null,
  parentId,
  productCount: parentId === null ? 0 : 2,
});

const product = (id: number, name: string): ProductListItem => ({
  id,
  name,
  slug: name.toLowerCase(),
  price: 100 * id,
  imageUrl: null,
  brandName: 'Acme',
  categoryName: 'Phones',
});

const page = (items: ProductListItem[]) => ({
  items,
  page: 1,
  pageSize: 8,
  totalCount: items.length,
  totalPages: 1,
});

describe('Home page', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({
          config: {
            availableLangs: ['en'],
            defaultLang: 'en',
            missingHandler: { logMissingKey: false },
          },
          loader: EmptyLoader,
        }),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows the new arrivals, the categories and a row per category', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();

    const newest = http.expectOne(
      (r) => r.url === `${API}/products` && r.params.get('sort') === 'newest',
    );
    newest.flush(page([product(1, 'Alpha Phone'), product(2, 'Beta Phone')]));
    http
      .expectOne(`${API}/categories`)
      .flush([category(1, 'Electronics', null), category(2, 'Phones', 1)]);
    http.expectOne(`${API}/brands`).flush([]);
    await fixture.whenStable();

    // صف منتجات القسم الفرعي
    const row = http.expectOne(
      (r) => r.url === `${API}/products` && r.params.get('categoryId') === '2',
    );
    row.flush(page([product(3, 'Gamma Phone')]));
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';
    expect(text).toContain('Alpha Phone');
    expect(text).toContain('Gamma Phone');
    // تصنيف رئيسي (Electronics) مش بيظهر كبلاطة، الفرعي (Phones) بيظهر
    const tiles = [...element.querySelectorAll('a[href*="categoryId=2"]')];
    expect(tiles.length).toBeGreaterThan(0);
    expect(element.querySelector('a[href*="categoryId=1"]')).toBeNull();
  });

  it('keeps working when the catalogue cannot be loaded', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();

    http
      .expectOne((r) => r.url === `${API}/products` && r.params.get('sort') === 'newest')
      .flush({ title: 'Server error' }, { status: 500, statusText: 'Server Error' });
    http
      .expectOne(`${API}/categories`)
      .flush({ title: 'Server error' }, { status: 500, statusText: 'Server Error' });
    http
      .expectOne(`${API}/brands`)
      .flush({ title: 'Server error' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')).not.toBeNull();
    expect(element.querySelector('app-product-card')).toBeNull();
  });
});
