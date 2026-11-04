import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { PartidosService } from './partidos.service.js';

@Controller('partidos')
@UseGuards(AuthGuard) // solo usuarios logueados (token válido)
export class PartidosController {
  constructor(private readonly partidosService: PartidosService) {}

  // GET /partidos -> partidos de la fecha actual (Liga Profesional y Primera Nacional), ordenados por horario
  @Get()
  listar() {
    return this.partidosService.listar();
  }
}
