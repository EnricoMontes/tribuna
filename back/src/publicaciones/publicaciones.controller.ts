import { Controller } from '@nestjs/common';
import { PublicacionesService } from './publicaciones.service.js';

// Rutas /publicaciones -> se implementan en el sprint 2
@Controller('publicaciones')
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}
}
