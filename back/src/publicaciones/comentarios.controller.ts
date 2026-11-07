import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { AuthGuard, type DatosToken } from '../auth/guards/auth.guard.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { ComentariosService } from './comentarios.service.js';
import { ComentarioDto } from './dto/comentario.dto.js';
import { PaginacionDto } from './dto/paginacion.dto.js';

/**
 * Comentarios controller, dentro del módulo publicaciones (como pide la consigna).
 * Las rutas cuelgan de la publicación: /publicaciones/:id/comentarios
 * ParseObjectIdPipe: si un id no tiene formato de ObjectId de Mongo -> 400.
 */
@Controller('publicaciones/:id/comentarios')
@UseGuards(AuthGuard)
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  // GET /publicaciones/:id/comentarios?offset=0&limit=5 -> los más recientes primero
  @Get()
  listar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() paginacion: PaginacionDto,
  ) {
    return this.comentariosService.listar(id.toString(), paginacion);
  }

  // POST /publicaciones/:id/comentarios  (JSON: { mensaje }) -> 201
  @Post()
  crear(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() datos: ComentarioDto,
    @UsuarioActual() usuario: DatosToken,
  ) {
    return this.comentariosService.crear(id.toString(), datos, usuario);
  }

  // PUT /publicaciones/:id/comentarios/:idComentario  (JSON: { mensaje }) -> 200, con modificado: true
  @Put(':idComentario')
  editar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('idComentario', ParseObjectIdPipe) idComentario: string,
    @Body() datos: ComentarioDto,
    @UsuarioActual() usuario: DatosToken,
  ) {
    return this.comentariosService.editar(
      id.toString(),
      idComentario.toString(),
      datos,
      usuario,
    );
  }
}
