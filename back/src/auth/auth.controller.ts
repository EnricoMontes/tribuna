import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { opcionesImagen } from '../archivos/imagen.filtro.js';
import { AuthService } from './auth.service.js';
import { AuthGuard, type DatosToken } from './guards/auth.guard.js';
import { UsuarioActual } from './usuario-actual.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/registro  (multipart/form-data: los datos + el archivo "fotoPerfil")
  // Responde 201 Created (el default de @Post en Nest).
  @Post('registro')
  @UseInterceptors(FileInterceptor('fotoPerfil', opcionesImagen))
  registro(
    @Body() datos: RegistroDto,
    @UploadedFile() fotoPerfil?: Express.Multer.File,
  ) {
    return this.authService.registro(datos, fotoPerfil);
  }

  // POST /auth/login  (JSON: { identificador, password })
  // @HttpCode(200): el login no crea ningún recurso, así que no corresponde 201.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() datos: LoginDto) {
    return this.authService.login(datos);
  }

  // POST /auth/autorizar  (header Authorization: Bearer <token>)
  // La usa la pantalla de carga al abrir la app: si el token es válido y no venció -> 200 con los
  // datos del usuario; si no -> 401 (lo responde el AuthGuard).
  @Post('autorizar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  autorizar(@UsuarioActual() usuario: DatosToken) {
    return this.authService.autorizar(usuario);
  }

  // POST /auth/refrescar  (header Authorization: Bearer <token>)
  // Con un token todavía válido devuelve uno nuevo, con la misma payload y otros 15 minutos.
  // Lo usa el modal "¿Querés extender la sesión?". Si el token ya venció -> 401.
  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  refrescar(@UsuarioActual() usuario: DatosToken) {
    return this.authService.refrescar(usuario);
  }
}
