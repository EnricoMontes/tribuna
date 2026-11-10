import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RangoFechasDto } from './dto/rango-fechas.dto.js';
import { EstadisticasService } from './estadisticas.service.js';

/**
 * Sprint 4 — "Módulo publicaciones - Estadísticas controller: realizar todas las rutas necesarias
 * por GET para que los gráficos funcionen. Se debe validar que el token pertenezca a un administrador."
 * Por eso los dos guards van en TODO el controller: sin token -> 401; usuario común -> 403.
 * Las tres reciben el lapso de tiempo: ?desde=AAAA-MM-DD&hasta=AAAA-MM-DD
 */
@Controller('estadisticas')
@UseGuards(AuthGuard, AdminGuard)
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  // GET /estadisticas/publicaciones-por-usuario -> { desde, hasta, total, datos: [{ usuario, cantidad }] }
  @Get('publicaciones-por-usuario')
  publicacionesPorUsuario(@Query() rango: RangoFechasDto) {
    return this.estadisticasService.publicacionesPorUsuario(rango);
  }

  // GET /estadisticas/comentarios-por-dia -> { desde, hasta, total, datos: [{ fecha, cantidad }] }
  @Get('comentarios-por-dia')
  comentariosPorDia(@Query() rango: RangoFechasDto) {
    return this.estadisticasService.comentariosPorDia(rango);
  }

  // GET /estadisticas/comentarios-por-publicacion -> { desde, hasta, total, datos: [{ publicacion, cantidad }] }
  @Get('comentarios-por-publicacion')
  comentariosPorPublicacion(@Query() rango: RangoFechasDto) {
    return this.estadisticasService.comentariosPorPublicacion(rango);
  }
}
