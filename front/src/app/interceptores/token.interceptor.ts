import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, EMPTY, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Auth } from '../servicios/auth';

/**
 * Interceptor funcional: Angular lo ejecuta en CADA petición de HttpClient, antes de mandarla.
 * 1) Si hay token, clona la petición agregándole el header "Authorization: Bearer <token>"
 *    (las peticiones son inmutables: por eso se clona en vez de modificarla).
 *    Así ningún servicio tiene que acordarse de mandar el token a mano.
 * 2) Captura el 401: si la API responde 401 a una petición que llevaba token (venció o no es
 *    válido), lo deja escrito en la consola, cierra la sesión y vuelve al login con UN modal
 *    genérico ("Tu sesión venció"), sea cual sea el endpoint (me gusta, comentar, publicar...).
 *    Corrección del profe: al vencer el token NO se desloguea solo. El usuario se queda en la
 *    pantalla; recién en el PRÓXIMO pedido a la API el back responde 401 (se ve en la consola del
 *    navegador > Network) y ahí este interceptor lo saca. Así se puede probar un pedido con el
 *    token vencido.
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
        console.error(
          `401 Unauthorized en ${peticion.method} ${peticion.url}: el token venció o no es válido.`,
          error.error,
        );
        auth.sesionVencida(); // cierra la sesión, va al login y avisa con el modal
        // EMPTY: el pedido termina acá y el 401 NO llega al componente. Si llegara, cada uno
        // mostraría su propio modal ("No se pudo actualizar el me gusta", "No se pudo comentar"...)
        // encima del genérico. El 401 igual queda en la consola y en Network.
        return EMPTY;
      }
      // Cualquier otro error sigue su camino: el componente muestra su mensaje en el modal
      return throwError(() => error);
    }),
  );
};
