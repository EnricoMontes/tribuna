import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { Perfil } from '../../usuarios/entities/usuario.entity.js';

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
 * 3) deja los datos en request.usuario para que los use el controller
 * Si algo falla -> 401 Unauthorized.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestConUsuario>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Tenés que iniciar sesión');
    }
    try {
      request.usuario = this.jwtService.verify<DatosToken>(token);
    } catch {
      throw new UnauthorizedException('La sesión venció o no es válida');
    }
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    return tipo === 'Bearer' ? token : undefined;
  }
}
