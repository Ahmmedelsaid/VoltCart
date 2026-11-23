import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { LanguageService } from './core/i18n/language.service';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { problemDetailsInterceptor } from './core/interceptors/problem-details.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: بارامترات الـ route (:id) بتوصل للـ component كـ input
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([problemDetailsInterceptor])),
    provideTransloco({
      config: {
        availableLangs: ['ar', 'en'],
        defaultLang: 'ar',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    // بنحمّل ترجمة اللغة الحالية قبل أول render، عشان ما تظهرش المفاتيح للحظة
    provideAppInitializer(() => {
      const transloco = inject(TranslocoService);
      const lang = inject(LanguageService).lang();
      transloco.setActiveLang(lang);
      return firstValueFrom(transloco.load(lang));
    }),
  ],
};
