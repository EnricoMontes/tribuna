import { Module } from '@nestjs/common';
import { PromiedosModule } from '../promiedos/promiedos.module.js';
import { CuadrosController } from './cuadros.controller.js';
import { CuadrosService } from './cuadros.service.js';

@Module({
  imports: [PromiedosModule],
  controllers: [CuadrosController],
  providers: [CuadrosService],
  // AuthModule lo usa para validar el cuadro elegido en el registro
  exports: [CuadrosService],
})
export class CuadrosModule {}
