import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { PartidosService } from './partidos.service.js';

@Controller('partidos')
@UseGuards(AuthGuard) // solo usuarios logueados (token válido)
export class PartidosController {
  constructor(private readonly partidosService: PartidosService) {}

  // GET /partidos -> partidos YA JUGADOS del torneo actual de la Liga Profesional (con el resultado),
  // del más reciente al más viejo
  @Get()
  listar() {
    return this.partidosService.listar();
  }
}
