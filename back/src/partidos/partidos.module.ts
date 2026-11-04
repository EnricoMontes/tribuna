import { Module } from '@nestjs/common';
import { PromiedosModule } from '../promiedos/promiedos.module.js';
import { PartidosController } from './partidos.controller.js';
import { PartidosService } from './partidos.service.js';

@Module({
  imports: [PromiedosModule],
  controllers: [PartidosController],
  providers: [PartidosService],
  // PublicacionesModule lo usa para validar el partido de una publicación nueva
  exports: [PartidosService],
})
export class PartidosModule {}
