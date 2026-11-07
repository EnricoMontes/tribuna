import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Auth } from '../servicios/auth';

/**
 * Interceptor funcional: Angular lo ejecuta en CADA petición de HttpClient, antes de mandarla.
 * 1) Si hay token, clona la petición agregándole el header "Authorization: Bearer <token>"
 *    (las peticiones son inmutables: por eso se clona en vez de modificarla).
 *    Así ningún servicio tiene que acordarse de mandar el token a mano.
 * 2) Si la API responde 401 a una petición que llevaba token (venció a los 15 min o no es
 *    válido), se cierra la sesión y se vuelve al login para rehacer el token (lo pide la consigna).
 *    Excepción: el 401 de /auth/autorizar lo maneja la pantalla de carga (el guard manda al login
 *    sin mostrar "tu sesión venció", porque puede ser alguien que entra por primera vez).
 * Solo se toca lo que va a nuestra API (no otras URLs).
 */
export const tokenInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const auth = inject(Auth);
  const token = auth.token();

  if (!token || !peticion.url.startsWith(environment.apiUrl)) {
    return siguiente(peticion);
  }

  return siguiente(peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: unknown) => {
      const esAutorizar = peticion.url.endsWith('/auth/autorizar');
      if (error instanceof HttpErrorResponse && error.status === 401 && !esAutorizar) {
        auth.sesionVencida(); // cierra la sesión, va al login y avisa con el modal
      }
      // El error sigue su camino: el componente muestra el mensaje en el modal
      return throwError(() => error);
    }),
  );
};
