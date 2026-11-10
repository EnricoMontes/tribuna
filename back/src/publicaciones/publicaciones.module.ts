import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArchivosModule } from '../archivos/archivos.module.js';
import { PartidosModule } from '../partidos/partidos.module.js';
import { ComentariosController } from './comentarios.controller.js';
import { ComentariosService } from './comentarios.service.js';
import { EstadisticasController } from './estadisticas.controller.js';
import { EstadisticasService } from './estadisticas.service.js';
import { Comentario, ComentarioSchema } from './entities/comentario.entity.js';
import {
  Publicacion,
  PublicacionSchema,
} from './entities/publicacion.entity.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema },
    ]),
    ArchivosModule, // subir la imagen a Cloudinary
    PartidosModule, // validar que el partido sea de la fecha actual
  ],
  // Los comentarios viven dentro del módulo publicaciones: un comentario no existe sin su publicación.
  // Las estadísticas también (la consigna dice "Módulo publicaciones - Estadísticas controller").
  controllers: [
    PublicacionesController,
    ComentariosController,
    EstadisticasController,
  ],
  providers: [PublicacionesService, ComentariosService, EstadisticasService],
})
export class PublicacionesModule {}
