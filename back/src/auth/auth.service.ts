import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuarioDocument } from '../usuarios/entities/usuario.entity.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { DatosToken } from './guards/auth.guard.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Las validaciones, la foto y el hash están en UsuariosService.crearUsuario, porque el alta
   * que hace un administrador (POST /usuarios) es igual. Acá solo se agrega el token.
   * El perfil queda fijo en "usuario": nadie se puede registrar solo como administrador.
   */
  async registro(datos: RegistroDto, foto?: Express.Multer.File) {
    const usuario = await this.usuariosService.crearUsuario(
      datos,
      foto,
      'usuario',
    );
    return this.respuestaConToken(usuario);
  }

  async login({ identificador, password }: LoginDto) {
    const usuario = await this.usuariosService.buscarParaLogin(identificador);

    // bcrypt.compare encripta la contraseña recibida con el mismo salt del hash guardado y compara.
    // Mismo mensaje para "no existe" y "contraseña mal": no le damos pistas a un atacante.
    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    // Sprint 4: usuario deshabilitado por un administrador -> 403 Forbidden.
    // Se chequea DESPUÉS de la contraseña: así solo se entera el dueño de la cuenta, no
    // cualquiera que pruebe nombres de usuario. 403 y no 401 porque las credenciales están
    // bien (sabemos quién es), lo que no tiene es permiso para entrar.
    if (usuario.habilitado === false) {
      throw new ForbiddenException(
        'Tu cuenta fue deshabilitada por un administrador. No podés ingresar a Tribuna.',
      );
    }

    return this.respuestaConToken(usuario);
  }

  /**
   * POST /auth/autorizar: el AuthGuard ya verificó la firma y que el token no esté vencido
   * (si no, respondió 401). Acá se devuelven los datos ACTUALES del usuario desde la base.
   * Si el usuario ya no existe o lo deshabilitaron después de emitir el token -> también 401.
   */
  async autorizar(datosToken: DatosToken) {
    const usuario = await this.usuarioVigente(datosToken.sub);
    return { usuario: usuario.toJSON() };
  }

  /**
   * POST /auth/refrescar: devuelve un token NUEVO con la misma payload y otros 15 minutos.
   * El token viejo trae además "iat" (cuándo se emitió) y "exp" (cuándo vence): se descartan,
   * porque sign() los vuelve a calcular. Si se copiaran, el nuevo vencería igual que el viejo.
   * Antes se mira la base: a un usuario deshabilitado no se le extiende la sesión.
   */
  async refrescar({ sub, nombreUsuario, perfil }: DatosToken) {
    await this.usuarioVigente(sub);
    const datos: DatosToken = { sub, nombreUsuario, perfil };
    return { token: this.jwtService.sign(datos) };
  }

  /** El usuario del token tiene que seguir existiendo y estar habilitado; si no -> 401 */
  private async usuarioVigente(id: string) {
    const usuario = await this.usuariosService.buscarPorId(id);
    if (!usuario || usuario.habilitado === false) {
      throw new UnauthorizedException('La sesión no es válida');
    }
    return usuario;
  }

  /** Login y registro devuelven los datos del usuario + el token firmado (vence en 15 min) */
  private respuestaConToken(usuario: UsuarioDocument) {
    const datos: DatosToken = {
      sub: usuario._id.toString(),
      nombreUsuario: usuario.nombreUsuario,
      perfil: usuario.perfil,
    };
    return {
      usuario: usuario.toJSON(), // toJSON borra la contraseña (ver usuario.entity.ts)
      token: this.jwtService.sign(datos),
    };
  }
}
