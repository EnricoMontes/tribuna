import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { RequestConUsuario } from './auth.guard.js';

/**
 * Guard de administrador. Va SIEMPRE después del AuthGuard: @UseGuards(AuthGuard, AdminGuard)
 * (Nest ejecuta los guards en ese orden). El AuthGuard ya verificó el token y dejó sus datos
 * en request.usuario; acá solo se mira el rol que viene adentro del token.
 *
 * - Sin token o token vencido -> 401 (lo corta antes el AuthGuard): "no sé quién sos".
 * - Token válido pero perfil "usuario" -> 403 Forbidden: "sé quién sos, pero no tenés permiso".
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { usuario } = context.switchToHttp().getRequest<RequestConUsuario>();
    if (usuario?.perfil !== 'administrador') {
      throw new ForbiddenException(
        'Solo un administrador puede realizar esta acción',
      );
    }
    return true;
  }
}
