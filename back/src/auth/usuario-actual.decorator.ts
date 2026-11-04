import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { DatosToken, RequestConUsuario } from './guards/auth.guard.js';

/**
 * Decorador de parámetro propio: @UsuarioActual() usuario
 * Devuelve lo que el AuthGuard dejó en request.usuario (los datos del token).
 * Es lo mismo que hacer @Req() req y leer req.usuario, pero más claro en el controller.
 */
export const UsuarioActual = createParamDecorator(
  (_dato: unknown, context: ExecutionContext): DatosToken =>
    context.switchToHttp().getRequest<RequestConUsuario>().usuario,
);
