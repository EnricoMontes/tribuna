import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import localeEsAr from '@angular/common/locales/es-AR';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// Fechas en castellano en el pipe date ("10 de mayo de 2000")
registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // HttpClient para hablar con la API de Nest (withFetch usa la API fetch del navegador)
    provideHttpClient(withFetch()),
    { provide: LOCALE_ID, useValue: 'es-AR' },
  ],
};
