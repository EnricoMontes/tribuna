import { Injectable } from '@nestjs/common';

// API de promiedos.com.ar: no es pública ni está documentada; es la que usa su propia página.
// Pide el header X-VER (la versión de su app). La misma respuesta de cada liga trae
// las tablas (de ahí salen los cuadros) y los partidos de la fecha actual.
const API = 'https://api.promiedos.com.ar';
const VERSION_API = '1.11.7.5';
// Los partidos cambian de estado (Prog. -> En vivo -> Final): no conviene guardar la respuesta mucho tiempo
const DIEZ_MINUTOS = 10 * 60 * 1000;
// Una fecha que ya se jugó no cambia más: se puede guardar más tiempo
const SEIS_HORAS = 6 * 60 * 60 * 1000;

export const LIGAS = [
  { id: 'hc', nombre: 'Liga Profesional' },
  { id: 'ebj', nombre: 'Primera Nacional' },
] as const;

export interface EquipoPromiedos {
  id: string;
  name: string;
}

export interface PartidoPromiedos {
  id: string;
  teams: [EquipoPromiedos, EquipoPromiedos];
  start_time: string; // "05-11-2026 15:00" (en la zona horaria de quien pregunta)
  status: { enum: number; name: string }; // enum 3 = "Finalizado"
  scores?: [number, number]; // goles de local y visitante (cuando ya se jugó)
}

export const PARTIDO_FINALIZADO = 3;

/** Forma (resumida) de lo que devuelve /league/tables_and_fixtures/:id */
export interface RespuestaLiga {
  tables_groups?: {
    tables: { table: { rows: { entity: { object: EquipoPromiedos } }[] } }[];
  }[];
  games?: {
    // Cada filtro es una fecha ("Fecha 1", "Fecha 2"...). La "selected" es la actual y trae sus partidos.
    filters: {
      key: string;
      name: string;
      selected?: boolean;
      games?: PartidoPromiedos[];
    }[];
  };
}

@Injectable()
export class PromiedosService {
  // Caché en memoria por liga: así cuadros y partidos no le pegan a promiedos en cada petición
  private cache = new Map<string, { datos: unknown; vence: number }>();

  /** URL del escudo de un equipo (PNG de 200x200) */
  escudo(idEquipo: string) {
    return `${API}/images/team/${idEquipo}/3`;
  }

  /** Tablas de posiciones + lista de fechas de la liga (con los partidos de la fecha actual) */
  async liga(idLiga: string): Promise<RespuestaLiga> {
    const datos = await this.pedir<RespuestaLiga>(
      `/league/tables_and_fixtures/${idLiga}`,
      DIEZ_MINUTOS,
    );
    if (!datos.tables_groups) {
      throw new Error('promiedos respondió sin datos');
    }
    return datos;
  }

  /** Partidos de una fecha puntual (la "key" sale de la lista de fechas de liga()) */
  async fecha(idLiga: string, clave: string): Promise<PartidoPromiedos[]> {
    const datos = await this.pedir<{ games?: PartidoPromiedos[] }>(
      `/league/games/${idLiga}/${clave}`,
      SEIS_HORAS,
    );
    return datos.games ?? [];
  }

  // GET a la API con el header X-VER, guardando la respuesta en la caché el tiempo indicado
  private async pedir<T>(ruta: string, duracion: number): Promise<T> {
    const guardado = this.cache.get(ruta);
    if (guardado && guardado.vence > Date.now()) {
      return guardado.datos as T;
    }
    const respuesta = await fetch(`${API}${ruta}`, {
      headers: { 'X-VER': VERSION_API },
      signal: AbortSignal.timeout(5000), // si tarda más de 5 s, se corta
    });
    if (!respuesta.ok) {
      throw new Error(`promiedos respondió HTTP ${respuesta.status}`);
    }
    const datos = (await respuesta.json()) as T;
    this.cache.set(ruta, { datos, vence: Date.now() + duracion });
    return datos;
  }
}
