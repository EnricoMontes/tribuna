import { Controller, Get } from '@nestjs/common';
import { CuadrosService } from './cuadros.service.js';

@Controller('cuadros')
export class CuadrosController {
  constructor(private readonly cuadrosService: CuadrosService) {}

  // GET /cuadros -> categorías con sus equipos y el escudo de cada uno (para el <select> del registro)
  @Get()
  async listar() {
    const categorias = await this.cuadrosService.listar();
    return categorias.map((categoria) => ({
      nombre: categoria.nombre,
      cuadros: categoria.cuadros.map((cuadro) => ({
        ...cuadro,
        escudo: this.cuadrosService.escudo(cuadro.id),
      })),
    }));
  }
}
