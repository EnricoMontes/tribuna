import { Injectable, Logger } from '@nestjs/common';
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

// API de promiedos.com.ar: no es pública ni está documentada; es la que usa su propia página.
// Pide el header X-VER (la versión de su app) y devuelve las tablas de cada liga con los equipos.
const API = 'https://api.promiedos.com.ar';
const VERSION_API = '1.11.7.5';
const LIGAS = [
  { id: 'hc', nombre: 'Liga Profesional' },
  { id: 'ebj', nombre: 'Primera Nacional' },
];
const UN_DIA = 24 * 60 * 60 * 1000;

/** Forma (resumida) de lo que devuelve /league/tables_and_fixtures/:id */
interface RespuestaLiga {
  tables_groups?: {
    tables: {
      table: { rows: { entity: { object: { id: string; name: string } } }[] };
    }[];
  }[];
}

@Injectable()
export class CuadrosService {
  private readonly logger = new Logger(CuadrosService.name);

  // Caché en memoria: la lista de equipos casi no cambia, no tiene sentido pedirla en cada registro
  private cache: { categorias: Categoria[]; vence: number } | null = null;

  /** Escudo del equipo, servido por la misma API (imagen PNG de 200x200). */
  escudo(id: string) {
    return `${API}/images/team/${id}/3`;
  }

  async listar(): Promise<Categoria[]> {
    if (this.cache && this.cache.vence > Date.now()) {
      return this.cache.categorias;
    }
    try {
      const categorias = await Promise.all(
        LIGAS.map(async (liga) => ({
          nombre: liga.nombre,
          cuadros: await this.equiposDeLiga(liga.id),
        })),
      );
      this.cache = { categorias, vence: Date.now() + UN_DIA };
      return categorias;
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
    const respuesta = await fetch(
      `${API}/league/tables_and_fixtures/${idLiga}`,
      {
        headers: { 'X-VER': VERSION_API },
        signal: AbortSignal.timeout(5000), // si tarda más de 5 s, pasamos al respaldo
      },
    );
    if (!respuesta.ok) {
      throw new Error(`HTTP ${respuesta.status}`);
    }
    const datos = (await respuesta.json()) as RespuestaLiga;

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
