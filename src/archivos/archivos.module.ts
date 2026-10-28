import { Module } from '@nestjs/common';
import { ArchivosService } from './archivos.service.js';

// Módulo propio para reutilizar la subida de imágenes: hoy la usa el registro,
// en el sprint 2 la van a usar las publicaciones.
@Module({
  providers: [ArchivosService],
  exports: [ArchivosService],
})
export class ArchivosModule {}
