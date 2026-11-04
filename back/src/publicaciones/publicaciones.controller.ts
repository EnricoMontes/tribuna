import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { opcionesImagen } from '../archivos/imagen.filtro.js';
import { AuthGuard, type DatosToken } from '../auth/guards/auth.guard.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { PublicacionesService } from './publicaciones.service.js';

@Controller('publicaciones')
@UseGuards(AuthGuard) // todas las rutas piden token: "solo se accede estando logueado"
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  // POST /publicaciones  (multipart/form-data: titulo, mensaje, partidoId + archivo "imagen" opcional)
  @Post()
  @UseInterceptors(FileInterceptor('imagen', opcionesImagen))
  crear(
    @Body() datos: CrearPublicacionDto,
    @UsuarioActual() usuario: DatosToken,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.publicacionesService.crear(datos, usuario, imagen);
  }

  // GET /publicaciones?orden=fecha|meGusta&offset=0&limit=10&usuario=<id>&partido=<id>
  @Get()
  listar(
    @Query() filtros: ListarPublicacionesDto,
    @UsuarioActual() usuario: DatosToken,
  ) {
    return this.publicacionesService.listar(filtros, usuario);
  }

  // DELETE /publicaciones/:id -> baja lógica (autor o administrador)
  // ParseObjectIdPipe: si el id no tiene formato de ObjectId de Mongo -> 400
  @Delete(':id')
  eliminar(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() usuario: DatosToken,
  ) {
    return this.publicacionesService.eliminar(id.toString(), usuario);
  }

  // POST /publicaciones/:id/me-gusta -> 201 (se crea el me gusta) · 409 si ya lo había dado
  @Post(':id/me-gusta')
  darMeGusta(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() usuario: DatosToken,
  ) {
    return this.publicacionesService.darMeGusta(id.toString(), usuario);
  }

  // DELETE /publicaciones/:id/me-gusta -> 200 · 409 si no lo había dado
  @Delete(':id/me-gusta')
  @HttpCode(HttpStatus.OK)
  quitarMeGusta(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() usuario: DatosToken,
  ) {
    return this.publicacionesService.quitarMeGusta(id.toString(), usuario);
  }
}
