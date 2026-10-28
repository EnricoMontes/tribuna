import { Module } from '@nestjs/common';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';

// Sprint 1: el módulo queda creado y registrado en AppModule.
// Sprint 2: schema de Publicacion + alta, listado paginado, baja lógica y me gusta.
@Module({
  controllers: [PublicacionesController],
  providers: [PublicacionesService],
})
export class PublicacionesModule {}
