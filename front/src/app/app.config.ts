import { DATE_PIPE_DEFAULT_OPTIONS, registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localeEsAr from '@angular/common/locales/es-AR';
import {
  ApplicationConfig,
  isDevMode,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { tokenInterceptor } from './interceptores/token.interceptor';

// Fechas en castellano en el pipe date ("10 de mayo de 2000")
registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: los parámetros de la ruta (:id) y de la query (?partido=) llegan como input()
    provideRouter(routes, withComponentInputBinding()),
    // HttpClient para hablar con la API de Nest (withFetch usa la API fetch del navegador).
    // withInterceptors: el tokenInterceptor agrega el JWT a cada petición.
    provideHttpClient(withFetch(), withInterceptors([tokenInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-AR' },
    // El pipe date muestra siempre la hora argentina (UTC-3, sin horario de verano),
    // aunque la compu del usuario tenga otra zona horaria configurada
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: '-0300' } },
    // PWA (Sprint 4): registra el service worker que genera Angular (ngsw-worker.js), configurado
    // en ngsw-config.json. Solo en producción (en "ng serve" molestaría: guardaría versiones viejas).
    // registerWhenStable: se registra cuando la app terminó de arrancar (o a los 30 s), para no
    // competir con la carga inicial.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
