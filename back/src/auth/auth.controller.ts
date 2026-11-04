import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { opcionesImagen } from '../archivos/imagen.filtro.js';
import { AuthService } from './auth.service.js';
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
}
