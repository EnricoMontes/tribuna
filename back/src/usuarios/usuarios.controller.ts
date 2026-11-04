import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { opcionesImagen } from '../archivos/imagen.filtro.js';
import { AuthGuard, type DatosToken } from '../auth/guards/auth.guard.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { DisponibilidadDto } from './dto/disponibilidad.dto.js';
import { EditarPerfilDto } from './dto/editar-perfil.dto.js';
import { type ImagenesPerfil, UsuariosService } from './usuarios.service.js';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // La usa el validador asíncrono del registro en Angular para avisar "ese correo ya existe"
  // mientras el usuario escribe. (El listado/alta/baja para administradores llega en el sprint 4.)
  @Get('disponibilidad')
  async disponibilidad(@Query() { campo, valor }: DisponibilidadDto) {
    const enUso =
      campo === 'correo'
        ? await this.usuariosService.correoEnUso(valor)
        : await this.usuariosService.nombreUsuarioEnUso(valor);
    return { disponible: !enUso };
  }

  // PATCH /usuarios/mi-perfil (multipart/form-data): edita los datos del usuario logueado.
  // FileFieldsInterceptor (y no FileInterceptor) porque pueden venir DOS archivos: fotoPerfil y banner.
  // PATCH porque es una modificación parcial: solo cambia lo que se manda.
  @Patch('mi-perfil')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'fotoPerfil', maxCount: 1 },
        { name: 'banner', maxCount: 1 },
      ],
      opcionesImagen,
    ),
  )
  editarPerfil(
    @UsuarioActual() usuario: DatosToken,
    @Body() datos: EditarPerfilDto,
    @UploadedFiles() imagenes?: ImagenesPerfil,
  ) {
    return this.usuariosService.editarPerfil(usuario.sub, datos, imagenes);
  }
}
