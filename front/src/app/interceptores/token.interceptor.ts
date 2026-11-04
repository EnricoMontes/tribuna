import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { Auth } from '../servicios/auth';

/**
 * Interceptor funcional: Angular lo ejecuta en CADA petición de HttpClient, antes de mandarla.
 * Si hay token, clona la petición agregándole el header "Authorization: Bearer <token>"
 * (las peticiones son inmutables: por eso se clona en vez de modificarla).
 * Así ningún servicio tiene que acordarse de mandar el token a mano.
 * Solo se agrega para nuestra API (no para otras URLs).
 */
export const tokenInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const token = inject(Auth).token();
  if (!token || !peticion.url.startsWith(environment.apiUrl)) {
    return siguiente(peticion);
  }
  return siguiente(peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
