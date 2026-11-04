import { Module } from '@nestjs/common';
import { PromiedosService } from './promiedos.service.js';

// Acceso a la API de promiedos. Lo usan CuadrosModule y PartidosModule.
@Module({
  providers: [PromiedosService],
  exports: [PromiedosService],
})
export class PromiedosModule {}
