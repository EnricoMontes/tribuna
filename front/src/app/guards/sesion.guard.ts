import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { Auth } from '../servicios/auth';

/**
 * Guard funcional: "solo se puede acceder a la aplicación estando logueado".
 * canActivate se ejecuta ANTES de entrar a la ruta: si devuelve true entra,
 * y si devuelve un UrlTree, Angular redirige ahí (al login).
 *
 * Sprint 3: al abrir la app, antes de dejar pasar, espera la respuesta de POST /auth/autorizar
 * (mientras tanto se ve la pantalla de carga). Un guard puede devolver un Observable:
 * Angular espera a que emita para decidir.
 * Después de esa primera validación ya alcanza con mirar si hay sesión.
 */
export const sesionGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const alLogin = inject(Router).createUrlTree(['/login']);

  if (auth.verificando()) {
    return auth.verificarSesion().pipe(map((valida) => (valida ? true : alLogin)));
  }
  return auth.logueado() ? true : alLogin;
};
