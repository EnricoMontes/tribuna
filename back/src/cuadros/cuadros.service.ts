import { Injectable, Logger } from '@nestjs/common';
import { LIGAS, PromiedosService } from '../promiedos/promiedos.service.js';
import { CUADROS_RESPALDO } from './cuadros.respaldo.js';

export interface Cuadro {
  id: string;
  nombre: string;
}

export interface CuadroConEscudo extends Cuadro {
  escudo: string;
}

export interface Categoria {
  nombre: string;
  cuadros: Cuadro[];
}

@Injectable()
export class CuadrosService {
  private readonly logger = new Logger(CuadrosService.name);

  constructor(private readonly promiedos: PromiedosService) {}

  escudo(id: string) {
    return this.promiedos.escudo(id);
  }

  /** Cuadros de la Liga Profesional y de la Primera Nacional, sacados de las tablas de posiciones */
  async listar(): Promise<Categoria[]> {
    try {
      return await Promise.all(
        LIGAS.map(async (liga) => ({
          nombre: liga.nombre,
          cuadros: await this.equiposDeLiga(liga.id),
        })),
      );
    } catch (error) {
      // Si la API externa falla, usamos la copia local: el registro sigue andando igual
      this.logger.warn(
        `No se pudo consultar promiedos, uso la lista de respaldo: ${(error as Error).message}`,
      );
      return CUADROS_RESPALDO;
    }
  }

  /** Para validar el registro: devuelve el cuadro (con su escudo) o undefined si el id no existe. */
  async buscar(id: string): Promise<CuadroConEscudo | undefined> {
    const categorias = await this.listar();
    const cuadro = categorias
      .flatMap((categoria) => categoria.cuadros)
      .find((c) => c.id === id);
    return cuadro && { ...cuadro, escudo: this.escudo(cuadro.id) };
  }

  private async equiposDeLiga(idLiga: string): Promise<Cuadro[]> {
    const datos = await this.promiedos.liga(idLiga);

    // Un equipo aparece en varias tablas (Apertura, Clausura...): el Map por id saca los repetidos
    const equipos = new Map<string, string>();
    for (const grupo of datos.tables_groups ?? []) {
      for (const { table } of grupo.tables) {
        for (const fila of table.rows) {
          equipos.set(fila.entity.object.id, fila.entity.object.name);
        }
      }
    }
    if (equipos.size === 0) {
      throw new Error('la respuesta no trajo equipos');
    }
    return [...equipos]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
}
