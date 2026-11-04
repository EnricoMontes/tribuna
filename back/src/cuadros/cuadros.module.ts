import { Module } from '@nestjs/common';
import { CuadrosController } from './cuadros.controller.js';
import { CuadrosService } from './cuadros.service.js';

@Module({
  controllers: [CuadrosController],
  providers: [CuadrosService],
  // AuthModule lo usa para validar el cuadro elegido en el registro
  exports: [CuadrosService],
})
export class CuadrosModule {}
