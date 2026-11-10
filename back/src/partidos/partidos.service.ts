import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EquipoPromiedos,
  PARTIDO_FINALIZADO,
  PartidoPromiedos,
  PromiedosService,
} from '../promiedos/promiedos.service.js';

// Se publican fotos de partidos que YA SE JUGARON, de la Liga Profesional (torneo actual)
const LIGA = { id: 'hc', nombre: 'Liga Profesional' };

export interface Equipo {
  id: string;
  nombre: string;
  escudo: string;
}

// Un partido "traducido" a nuestro formato. Esta misma forma es la que se guarda dentro de cada publicación.
export interface Partido {
  id: string;
  liga: string; // "Liga Profesional" | "Primera Nacional"
  fecha: string; // nombre de la fecha: "Fecha 16", "Octavos de Final"...
  local: Equipo;
  visitante: Equipo;
  inicio: Date;
  goles: { local: number; visitante: number }; // el resultado
}

@Injectable()
export class PartidosService {
  private readonly logger = new Logger(PartidosService.name);

  // promiedos devuelve el horario en la zona horaria de QUIEN PREGUNTA (lo deduce por la IP).
  // Desde Argentina contesta en hora argentina, pero Render está en EE.UU. y le contesta en esa hora.
  // Por eso se configura en qué zona horaria nos responde (en Render: America/New_York).
  private readonly zonaHoraria: string;

  constructor(
    private readonly promiedos: PromiedosService,
    config: ConfigService,
  ) {
    this.zonaHoraria = config.get<string>(
      'PROMIEDOS_ZONA_HORARIA',
      'America/Argentina/Buenos_Aires',
    );
  }

  /**
   * Partidos ya jugados del torneo actual de la Liga Profesional, del más reciente al más viejo.
   * promiedos da la lista de fechas del año (Apertura y Clausura); la "selected" es la actual.
   * Se toman las fechas del MISMO torneo hasta la actual y, de cada una, los partidos finalizados.
   */
  async listar(): Promise<Partido[]> {
    try {
      const datos = await this.promiedos.liga(LIGA.id);
      const fechas = datos.games?.filters ?? [];
      const actual = fechas.find((f) => f.selected);
      if (!actual) {
        return [];
      }
      // Las keys son "temporada_torneo_FASE_numero": "72_228_8_16" = Fecha 16 de la fase regular del
      // Clausura; "72_228_9_-1" = Octavos de Final (otra FASE, número -1). Cada torneo arranca en su
      // "Fecha 1" y sigue con los playoffs. Entonces el torneo actual va desde la ÚLTIMA "Fecha 1"
      // anterior a la fecha actual hasta la actual (así, en los playoffs, siguen entrando las 16 fechas).
      const indiceActual = fechas.indexOf(actual);
      let inicio = indiceActual;
      while (inicio > 0 && !fechas[inicio].key.endsWith('_1')) {
        inicio--;
      }
      const fechasDelTorneo = fechas.slice(inicio, indiceActual + 1);

      // Todas las fechas a la vez (Promise.all). La actual ya viene con sus partidos.
      const porFecha = await Promise.all(
        fechasDelTorneo.map(async (fecha) => {
          const partidos =
            fecha.games ?? (await this.promiedos.fecha(LIGA.id, fecha.key));
          return partidos
            .filter((p) => p.status.enum === PARTIDO_FINALIZADO && p.scores)
            .map((p) => this.convertir(p, fecha.name));
        }),
      );
      return porFecha
        .flat()
        .sort((a, b) => b.inicio.getTime() - a.inicio.getTime());
    } catch (error) {
      this.logger.warn(
        `No se pudieron traer los partidos: ${(error as Error).message}`,
      );
      return [];
    }
  }

  /** Para validar una publicación nueva: tiene que ser un partido ya jugado del torneo actual */
  async buscar(id: string): Promise<Partido | undefined> {
    const partidos = await this.listar();
    return partidos.find((partido) => partido.id === id);
  }

  private convertir(p: PartidoPromiedos, fecha: string): Partido {
    return {
      id: p.id,
      liga: LIGA.nombre,
      fecha,
      local: this.equipo(p.teams[0]),
      visitante: this.equipo(p.teams[1]),
      inicio: this.leerHorario(p.start_time),
      goles: { local: p.scores![0], visitante: p.scores![1] },
    };
  }

  private equipo(equipo: EquipoPromiedos): Equipo {
    return {
      id: equipo.id,
      nombre: equipo.name,
      escudo: this.promiedos.escudo(equipo.id),
    };
  }

  /** "05-11-2026 15:00" (en la zona horaria en la que contesta promiedos) -> Date (un instante exacto) */
  private leerHorario(texto: string): Date {
    const [dia, mes, anio, hora, minutos] = texto.split(/[-\s:]/).map(Number);
    // Primero se toma la hora como si fuera UTC y después se le resta la diferencia de la zona horaria
    const comoUtc = Date.UTC(anio, mes - 1, dia, hora, minutos);
    return new Date(comoUtc - this.diferenciaConUtc(comoUtc));
  }

  /** Cuántos ms está la zona horaria adelantada respecto de UTC en ese momento (Argentina: -3 h) */
  private diferenciaConUtc(instante: number): number {
    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: this.zonaHoraria,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(new Date(instante));
    const valor = (tipo: string) =>
      Number(partes.find((p) => p.type === tipo)?.value);
    const enLaZona = Date.UTC(
      valor('year'),
      valor('month') - 1,
      valor('day'),
      valor('hour'),
      valor('minute'),
    );
    return enLaZona - instante;
  }
}
