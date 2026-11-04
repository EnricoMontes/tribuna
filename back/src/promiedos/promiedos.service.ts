import { Injectable } from '@nestjs/common';

// API de promiedos.com.ar: no es pública ni está documentada; es la que usa su propia página.
// Pide el header X-VER (la versión de su app). La misma respuesta de cada liga trae
// las tablas (de ahí salen los cuadros) y los partidos de la fecha actual.
const API = 'https://api.promiedos.com.ar';
const VERSION_API = '1.11.7.5';
// Los partidos cambian de estado (Prog. -> En vivo -> Final): no conviene guardar la respuesta mucho tiempo
const DIEZ_MINUTOS = 10 * 60 * 1000;

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
  start_time: string; // "05-11-2026 15:00" (hora argentina)
  status: { name: string }; // "Prog.", "Final", "ET"...
}

/** Forma (resumida) de lo que devuelve /league/tables_and_fixtures/:id */
export interface RespuestaLiga {
  tables_groups?: {
    tables: { table: { rows: { entity: { object: EquipoPromiedos } }[] } }[];
  }[];
  games?: {
    filters: { name: string; selected?: boolean; games?: PartidoPromiedos[] }[];
  };
}

@Injectable()
export class PromiedosService {
  // Caché en memoria por liga: así cuadros y partidos no le pegan a promiedos en cada petición
  private cache = new Map<string, { datos: RespuestaLiga; vence: number }>();

  /** URL del escudo de un equipo (PNG de 200x200) */
  escudo(idEquipo: string) {
    return `${API}/images/team/${idEquipo}/3`;
  }

  async liga(idLiga: string): Promise<RespuestaLiga> {
    const guardado = this.cache.get(idLiga);
    if (guardado && guardado.vence > Date.now()) {
      return guardado.datos;
    }
    const respuesta = await fetch(
      `${API}/league/tables_and_fixtures/${idLiga}`,
      {
        headers: { 'X-VER': VERSION_API },
        signal: AbortSignal.timeout(5000), // si tarda más de 5 s, se corta
      },
    );
    if (!respuesta.ok) {
      throw new Error(`promiedos respondió HTTP ${respuesta.status}`);
    }
    const datos = (await respuesta.json()) as RespuestaLiga;
    if (!datos.tables_groups) {
      throw new Error('promiedos respondió sin datos');
    }
    this.cache.set(idLiga, { datos, vence: Date.now() + DIEZ_MINUTOS });
    return datos;
  }
}
