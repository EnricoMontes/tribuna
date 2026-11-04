import { Injectable, Logger } from '@nestjs/common';
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

  constructor(private readonly promiedos: PromiedosService) {}

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

  /** "05-11-2026 15:00" (hora argentina, UTC-3) -> Date */
  private leerHorario(texto: string): Date {
    const [dia, mes, anio, hora, minutos] = texto.split(/[-\s:]/);
    return new Date(`${anio}-${mes}-${dia}T${hora}:${minutos}:00-03:00`);
  }
}
