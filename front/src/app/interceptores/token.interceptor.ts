import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Auth } from '../servicios/auth';

/**
 * Interceptor funcional: Angular lo ejecuta en CADA petición de HttpClient, antes de mandarla.
 * 1) Si hay token, clona la petición agregándole el header "Authorization: Bearer <token>"
 *    (las peticiones son inmutables: por eso se clona en vez de modificarla).
 *    Así ningún servicio tiene que acordarse de mandar el token a mano.
 * 2) Si la API responde 401 a una petición que llevaba token (venció a los 15 min o no es
 *    válido), se cierra la sesión y se vuelve al login.
 * Solo se toca lo que va a nuestra API (no otras URLs).
 */
export const tokenInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const token = auth.token();

  if (!token || !peticion.url.startsWith(environment.apiUrl)) {
    return siguiente(peticion);
  }

  return siguiente(peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.cerrarSesion();
        router.navigate(['/login']);
      }
      // El error sigue su camino: el componente muestra el mensaje en el modal
      return throwError(() => error);
    }),
  );
};
