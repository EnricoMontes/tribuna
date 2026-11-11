import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { Perfil } from '../../usuarios/entities/usuario.entity.js';
import { UsuariosService } from '../../usuarios/usuarios.service.js';

// Lo que va adentro del token: quién es (sub = _id de Mongo) y su rol
export interface DatosToken {
  sub: string;
  nombreUsuario: string;
  perfil: Perfil;
}

// La request con el usuario del token ya leído (lo pone el guard)
export type RequestConUsuario = Request & { usuario: DatosToken };

/**
 * Guard manual, igual que el del repo del profe (jwt/guards/auth.guard.ts):
 * 1) saca el token del header "Authorization: Bearer <token>"
 * 2) jwtService.verify comprueba la firma y que no esté vencido
 * 3) mira en la base que el usuario del token SIGA EXISTIENDO y esté HABILITADO
 * 4) deja los datos en request.usuario para que los use el controller
 * Si algo falla -> 401 Unauthorized.
 *
 * El paso 3 se agregó en la auditoría (11/11): antes, con un token todavía vigente,
 * - un usuario deshabilitado podía seguir publicando hasta que venciera (hasta 15 min);
 * - un token de un usuario que ya no existe creaba publicaciones sin autor (y el listado se rompía).
 * Cuesta una consulta chiquita por petición (por _id, que tiene índice, y trayendo un solo campo).
 * El perfil (rol) sigue saliendo del token: un cambio de rol se aplica al volver a iniciar sesión.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usuariosService: UsuariosService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestConUsuario>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Tenés que iniciar sesión');
    }
    let datos: DatosToken;
    try {
      datos = this.jwtService.verify<DatosToken>(token);
    } catch {
      throw new UnauthorizedException('La sesión venció o no es válida');
    }

    const usuario = await this.usuariosService.estadoParaSesion(datos.sub);
    if (!usuario) {
      throw new UnauthorizedException('La sesión no es válida');
    }
    if (usuario.habilitado === false) {
      // 401 (y no 403): el front, ante un 401, cierra la sesión y manda al login,
      // donde al intentar entrar se le avisa que la cuenta fue deshabilitada
      throw new UnauthorizedException(
        'Tu cuenta fue deshabilitada por un administrador',
      );
    }

    request.usuario = datos;
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    return tipo === 'Bearer' ? token : undefined;
  }
}
