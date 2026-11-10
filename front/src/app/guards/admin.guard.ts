import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of } from 'rxjs';
import { Auth } from '../servicios/auth';

/**
 * Sprint 4: el dashboard "solo está disponible para usuarios con perfil administrador".
 * - Sin sesión -> al login (igual que el sesionGuard).
 * - Con sesión pero perfil "usuario" -> a publicaciones.
 * Como el sesionGuard, si la app recién abre espera a POST /auth/autorizar: así, con F5 en
 * /dashboard, decide con los datos frescos del usuario y no con los guardados en localStorage.
 *
 * Es solo para la interfaz (que un usuario común no vea la pantalla). La seguridad real está
 * en el back: aunque alguien fuerce la ruta, GET /usuarios le responde 403.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  const sesion$ = auth.verificando() ? auth.verificarSesion() : of(auth.logueado());
  return sesion$.pipe(
    map((valida) => {
      if (!valida) return router.createUrlTree(['/login']);
      return auth.esAdmin() ? true : router.createUrlTree(['/publicaciones']);
    }),
  );
};
