import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { RangoFechasDto } from './dto/rango-fechas.dto.js';
import {
  Comentario,
  ComentarioDocument,
} from './entities/comentario.entity.js';
import {
  Publicacion,
  PublicacionDocument,
} from './entities/publicacion.entity.js';

// Argentina es UTC-3 todo el año (sin horario de verano): un "día" va de 00:00 a 23:59 en -03:00
const ZONA = '-03:00';
const DIA_MS = 24 * 60 * 60 * 1000;
const DIAS_POR_DEFECTO = 30;
const MAXIMO_DIAS = 366;

interface Rango {
  desde: string; // AAAA-MM-DD (para devolverlo y para rellenar los días)
  hasta: string;
  inicio: Date; // desde a las 00:00 (hora argentina)
  fin: Date; // el día DESPUÉS de hasta a las 00:00 -> se usa con $lt, así "hasta" entra entero
}

/**
 * Sprint 4 — las consultas de los gráficos del dashboard. Todo se calcula en MongoDB con
 * aggregate (group, lookup, sort): la base devuelve los números ya contados, en vez de traer
 * miles de documentos y contarlos en Node.
 * Solo cuenta lo que sigue disponible: publicaciones activas y comentarios de publicaciones activas
 * (una publicación dada de baja deja de estar disponible, junto con sus comentarios).
 */
@Injectable()
export class EstadisticasService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<PublicacionDocument>,
    @InjectModel(Comentario.name)
    private readonly comentarioModel: Model<ComentarioDocument>,
  ) {}

  /** Gráfico 1: cantidad de publicaciones de cada usuario en el lapso */
  async publicacionesPorUsuario(filtro: RangoFechasDto) {
    const rango = this.rango(filtro);
    const datos = await this.publicacionModel.aggregate<{
      usuario: {
        _id: string;
        nombreUsuario: string;
        nombre: string;
        apellido: string;
      };
      cantidad: number;
    }>([
      {
        $match: {
          activa: true,
          createdAt: { $gte: rango.inicio, $lt: rango.fin },
        },
      },
      // Agrupar por autor y contar: { _id: idDelAutor, cantidad: N }
      { $group: { _id: '$autor', cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1, _id: 1 } },
      // $lookup = el "join" de Mongo: trae los datos del autor desde la colección usuarios
      {
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'usuario',
          pipeline: [
            { $project: { nombreUsuario: 1, nombre: 1, apellido: 1 } },
          ],
        },
      },
      { $unwind: '$usuario' },
      { $project: { _id: 0, usuario: 1, cantidad: 1 } },
    ]);
    return {
      desde: rango.desde,
      hasta: rango.hasta,
      total: datos.reduce((suma, d) => suma + d.cantidad, 0),
      datos,
    };
  }

  /**
   * Gráfico 2: cantidad de comentarios realizados en el lapso, día por día.
   * Los días sin comentarios no aparecen en el $group: se completan con 0 acá, así el gráfico
   * de líneas muestra todos los días del lapso.
   */
  async comentariosPorDia(filtro: RangoFechasDto) {
    const rango = this.rango(filtro);
    const porDia = await this.comentarioModel.aggregate<{
      _id: string;
      cantidad: number;
    }>([
      ...this.comentariosDisponibles(rango),
      {
        $group: {
          // La fecha del comentario como texto AAAA-MM-DD en hora argentina
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: ZONA,
            },
          },
          cantidad: { $sum: 1 },
        },
      },
    ]);
    const cantidades = new Map(porDia.map((d) => [d._id, d.cantidad]));
    const datos = this.dias(rango).map((fecha) => ({
      fecha,
      cantidad: cantidades.get(fecha) ?? 0,
    }));
    return {
      desde: rango.desde,
      hasta: rango.hasta,
      total: datos.reduce((suma, d) => suma + d.cantidad, 0),
      datos,
    };
  }

  /** Gráfico 3: cantidad de comentarios que recibió cada publicación en el lapso */
  async comentariosPorPublicacion(filtro: RangoFechasDto) {
    const rango = this.rango(filtro);
    const datos = await this.comentarioModel.aggregate<{
      publicacion: { _id: string; titulo: string; autor: string };
      cantidad: number;
    }>([
      ...this.comentariosDisponibles(rango),
      { $group: { _id: '$publicacion', cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1, _id: 1 } },
      {
        $lookup: {
          from: 'publicaciones',
          localField: '_id',
          foreignField: '_id',
          as: 'publicacion',
          pipeline: [
            { $project: { titulo: 1, autor: 1 } },
            // y adentro, el nombre de usuario del autor de la publicación
            {
              $lookup: {
                from: 'usuarios',
                localField: 'autor',
                foreignField: '_id',
                as: 'autor',
                pipeline: [{ $project: { _id: 0, nombreUsuario: 1 } }],
              },
            },
            { $set: { autor: { $first: '$autor.nombreUsuario' } } },
          ],
        },
      },
      { $unwind: '$publicacion' },
      { $project: { _id: 0, publicacion: 1, cantidad: 1 } },
    ]);
    return {
      desde: rango.desde,
      hasta: rango.hasta,
      total: datos.reduce((suma, d) => suma + d.cantidad, 0),
      datos,
    };
  }

  /** Comentarios del lapso cuya publicación sigue activa (los de una dada de baja no cuentan) */
  private comentariosDisponibles(rango: Rango): PipelineStage[] {
    return [
      { $match: { createdAt: { $gte: rango.inicio, $lt: rango.fin } } },
      {
        $lookup: {
          from: 'publicaciones',
          localField: 'publicacion',
          foreignField: '_id',
          as: 'pub',
          pipeline: [{ $project: { activa: 1 } }],
        },
      },
      { $match: { 'pub.activa': true } },
    ];
  }

  /**
   * Pasa ?desde y ?hasta (días AAAA-MM-DD) a fechas exactas en hora argentina.
   * Sin parámetros: los últimos 30 días hasta hoy. desde > hasta o más de un año -> 400.
   */
  private rango({ desde, hasta }: RangoFechasDto): Rango {
    const hoy = this.diaArgentino(new Date());
    const hastaDia = hasta ?? hoy;
    const desdeDia =
      desde ??
      this.diaArgentino(
        new Date(
          this.inicioDelDia(hastaDia).getTime() -
            (DIAS_POR_DEFECTO - 1) * DIA_MS,
        ),
      );

    const inicio = this.inicioDelDia(desdeDia);
    const fin = new Date(this.inicioDelDia(hastaDia).getTime() + DIA_MS);
    // Un día que no existe (31/02) JavaScript lo "corre" al mes siguiente: se detecta
    // comparando la fecha que quedó con la que se pidió
    const existe = (dia: string) => {
      const fecha = this.inicioDelDia(dia);
      return !Number.isNaN(fecha.getTime()) && this.diaArgentino(fecha) === dia;
    };
    if (!existe(desdeDia) || !existe(hastaDia)) {
      throw new BadRequestException('La fecha no es válida');
    }
    if (inicio >= fin) {
      throw new BadRequestException(
        'La fecha "desde" no puede ser posterior a "hasta"',
      );
    }
    if (fin.getTime() - inicio.getTime() > MAXIMO_DIAS * DIA_MS) {
      throw new BadRequestException(
        `El lapso no puede superar los ${MAXIMO_DIAS} días`,
      );
    }
    return { desde: desdeDia, hasta: hastaDia, inicio, fin };
  }

  /** "2026-11-07" -> el 7/11 a las 00:00 en Argentina (03:00 UTC) */
  private inicioDelDia(dia: string): Date {
    return new Date(`${dia}T00:00:00${ZONA}`);
  }

  /** Una fecha exacta -> qué día es en Argentina (AAAA-MM-DD), sin depender de la zona del servidor */
  private diaArgentino(fecha: Date): string {
    return new Date(fecha.getTime() - 3 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
  }

  /** Todos los días del lapso, en orden: para completar con 0 los días sin comentarios */
  private dias({ inicio, fin }: Rango): string[] {
    const dias: string[] = [];
    for (let t = inicio.getTime(); t < fin.getTime(); t += DIA_MS) {
      dias.push(this.diaArgentino(new Date(t)));
    }
    return dias;
  }
}
