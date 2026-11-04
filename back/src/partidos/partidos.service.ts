import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EquipoPromiedos,
  LIGAS,
  PartidoPromiedos,
  PromiedosService,
} from '../promiedos/promiedos.service.js';

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
  estado: string; // "Prog.", "Final"... (solo informativo, cambia con el tiempo)
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

  /** Partidos de la fecha actual de cada liga (la que promiedos marca como "selected") */
  async listar(): Promise<Partido[]> {
    const porLiga = await Promise.all(
      LIGAS.map(async (liga) => {
        try {
          const datos = await this.promiedos.liga(liga.id);
          const fechaActual = datos.games?.filters.find((f) => f.selected);
          return (fechaActual?.games ?? []).map((partido) =>
            this.convertir(partido, liga.nombre, fechaActual!.name),
          );
        } catch (error) {
          // Si una liga falla, se muestran los partidos de la otra
          this.logger.warn(
            `No se pudieron traer los partidos de ${liga.nombre}: ${(error as Error).message}`,
          );
          return [];
        }
      }),
    );
    return porLiga
      .flat()
      .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  }

  /** Para validar una publicación nueva: el partido tiene que estar en la fecha actual */
  async buscar(id: string): Promise<Partido | undefined> {
    const partidos = await this.listar();
    return partidos.find((partido) => partido.id === id);
  }

  private convertir(p: PartidoPromiedos, liga: string, fecha: string): Partido {
    return {
      id: p.id,
      liga,
      fecha,
      local: this.equipo(p.teams[0]),
      visitante: this.equipo(p.teams[1]),
      inicio: this.leerHorario(p.start_time),
      estado: p.status.name,
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
