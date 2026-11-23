import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiError } from '../models/api.models';
import { problemDetailsInterceptor } from './problem-details.interceptor';

describe('problemDetailsInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([problemDetailsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  function failWith(init: { status: number; statusText?: string; body?: unknown }): ApiError {
    let captured: ApiError | undefined;
    http.get('/api/x').subscribe({ error: (error: ApiError) => (captured = error) });
    controller
      .expectOne('/api/x')
      .flush(init.body ?? null, { status: init.status, statusText: init.statusText ?? '' });
    return captured as ApiError;
  }

  it('passes successful responses through', () => {
    let body: unknown;
    http.get('/api/x').subscribe((value) => (body = value));
    controller.expectOne('/api/x').flush({ ok: true });
    expect(body).toEqual({ ok: true });
  });

  it('turns a ProblemDetails body into an ApiError', () => {
    const error = failWith({
      status: 400,
      body: {
        title: 'One or more validation errors occurred.',
        status: 400,
        errors: { MinPrice: ['MinPrice cannot be greater than MaxPrice.'] },
      },
    });

    expect(error.status).toBe(400);
    expect(error.title).toBe('One or more validation errors occurred.');
    expect(error.errors?.['MinPrice']).toEqual(['MinPrice cannot be greater than MaxPrice.']);
  });

  it('falls back to the status text when the body is not ProblemDetails', () => {
    const error = failWith({ status: 502, statusText: 'Bad Gateway' });
    expect(error).toEqual({ status: 502, title: 'Bad Gateway' });
  });

  it('reports status 0 when the server cannot be reached', () => {
    let captured: ApiError | undefined;
    http.get('/api/x').subscribe({ error: (error: ApiError) => (captured = error) });
    controller.expectOne('/api/x').error(new ProgressEvent('error'));

    expect(captured?.status).toBe(0);
  });
});
