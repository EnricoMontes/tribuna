import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { opcionesImagen } from '../archivos/imagen.filtro.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { AuthGuard, type DatosToken } from '../auth/guards/auth.guard.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { CambiarPerfilDto } from './dto/cambiar-perfil.dto.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { ListarUsuariosDto } from './dto/listar-usuarios.dto.js';
import { DisponibilidadDto } from './dto/disponibilidad.dto.js';
import { EditarPerfilDto } from './dto/editar-perfil.dto.js';
import { type ImagenesPerfil, UsuariosService } from './usuarios.service.js';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // La usa el validador asíncrono del registro en Angular para avisar "ese correo ya existe"
  // mientras el usuario escribe (y ahora también el formulario de alta del dashboard).
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

  // ───────────── Sprint 4: rutas del administrador ─────────────
  // @UseGuards(AuthGuard, AdminGuard): primero el token (401 si falta o venció) y después
  // el rol (403 si no es administrador). Van en cada ruta y no en todo el controller porque
  // "disponibilidad" y "mi-perfil" las usan usuarios comunes.

  // GET /usuarios?offset=0&limit=10&estado=todos|habilitados|deshabilitados|administradores&buscar=
  // -> 200 { usuarios, total, offset, limit, contadores }. Query inválida -> 400.
  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  listar(@Query() filtros: ListarUsuariosDto) {
    return this.usuariosService.listar(filtros);
  }

  // PATCH /usuarios/:id/perfil  { "perfil": "administrador" | "usuario" } -> 200 con el usuario.
  // PATCH porque cambia UN dato del usuario. 400 si el admin se quita el rol a sí mismo; 404 si no existe.
  // El rol también va adentro del token: el cambio se aplica cuando esa persona vuelve a iniciar sesión.
  @Patch(':id/perfil')
  @UseGuards(AuthGuard, AdminGuard)
  cambiarPerfil(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() { perfil }: CambiarPerfilDto,
    @UsuarioActual() admin: DatosToken,
  ) {
    return this.usuariosService.cambiarPerfil(id.toString(), perfil, admin.sub);
  }

  // POST /usuarios (multipart/form-data) -> 201 con el usuario creado.
  // Mismos datos que el registro + "perfil" (usuario | administrador). No devuelve token:
  // el admin sigue logueado como él mismo, solo crea la cuenta de otro.
  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('fotoPerfil', opcionesImagen))
  crear(
    @Body() datos: CrearUsuarioDto,
    @UploadedFile() fotoPerfil?: Express.Multer.File,
  ) {
    return this.usuariosService.crearUsuario(datos, fotoPerfil, datos.perfil);
  }

  // DELETE /usuarios/:id -> baja lógica (habilitado = false). 200 con el usuario actualizado.
  // 400 si el id no es un ObjectId o si el admin se quiere deshabilitar a sí mismo; 404 si no existe.
  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  deshabilitar(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() admin: DatosToken,
  ) {
    return this.usuariosService.cambiarHabilitado(
      id.toString(),
      false,
      admin.sub,
    );
  }

  // POST /usuarios/:id/habilitar -> alta lógica (habilitado = true). 200 y no 201, porque no se
  // crea nada nuevo: se reactiva un usuario que ya existía.
  @Post(':id/habilitar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, AdminGuard)
  habilitar(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() admin: DatosToken,
  ) {
    return this.usuariosService.cambiarHabilitado(
      id.toString(),
      true,
      admin.sub,
    );
  }
}
