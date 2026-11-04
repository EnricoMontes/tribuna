import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../servicios/auth';

/**
 * Guard funcional: "solo se puede acceder a la aplicación estando logueado".
 * canActivate se ejecuta ANTES de entrar a la ruta: si devuelve true entra,
 * y si devuelve un UrlTree, Angular redirige ahí (al login).
 * (canMatch sería parecido, pero decide si la ruta "matchea": con canMatch el
 * componente lazy ni siquiera se descarga si no hay sesión.)
 */
export const sesionGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  return auth.logueado() ? true : inject(Router).createUrlTree(['/login']);
};
