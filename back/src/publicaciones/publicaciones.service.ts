import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ArchivosService } from '../archivos/archivos.service.js';
import type { DatosToken } from '../auth/guards/auth.guard.js';
import { PartidosService } from '../partidos/partidos.service.js';
import { conAutor } from './autor-eliminado.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import {
  Comentario,
  ComentarioDocument,
} from './entities/comentario.entity.js';
import {
  Publicacion,
  PublicacionDocument,
} from './entities/publicacion.entity.js';

// Datos del autor que se muestran en cada publicación (nunca la contraseña ni el correo)
const CAMPOS_AUTOR = 'nombre apellido nombreUsuario fotoPerfil cuadro';
// Cuántos comentarios se muestran de adelanto en cada tarjeta del listado
const COMENTARIOS_ADELANTO = 2;

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<PublicacionDocument>,
    @InjectModel(Comentario.name)
    private readonly comentarioModel: Model<ComentarioDocument>,
    private readonly partidosService: PartidosService,
    private readonly archivosService: ArchivosService,
  ) {}

  async crear(
    datos: CrearPublicacionDto,
    usuario: DatosToken,
    imagen?: Express.Multer.File,
  ) {
    // El partido tiene que ser uno ya jugado del torneo actual -> si no, 400
    const partido = await this.partidosService.buscar(datos.partidoId);
    if (!partido) {
      throw new BadRequestException(
        'El partido elegido no es un partido ya jugado del torneo actual',
      );
    }

    // Igual que en el registro: la imagen se sube recién cuando los datos están bien
    const urlImagen = imagen
      ? await this.archivosService.subirImagen(imagen, 'publicaciones')
      : null;

    const publicacion = await this.publicacionModel.create({
      titulo: datos.titulo,
      mensaje: datos.mensaje,
      imagen: urlImagen,
      autor: new Types.ObjectId(usuario.sub), // el autor sale del TOKEN, no del body
      partido, // copia del partido (con el resultado)
    });
    await publicacion.populate('autor', CAMPOS_AUTOR);
    return this.paraRespuesta(publicacion, usuario.sub);
  }

  async listar(filtros: ListarPublicacionesDto, usuario: DatosToken) {
    const condicion: Record<string, unknown> = { activa: true };
    if (filtros.usuario) condicion.autor = new Types.ObjectId(filtros.usuario);
    if (filtros.partido) condicion['partido.id'] = filtros.partido;

    // Por me gusta: las de más me gusta primero y, si empatan, la más nueva
    const orden: Record<string, 1 | -1> =
      filtros.orden === 'meGusta'
        ? { cantidadMeGusta: -1, createdAt: -1 }
        : { createdAt: -1 };

    // Las dos consultas a la vez: la página pedida y el total (para saber cuántas páginas hay)
    const [publicaciones, total] = await Promise.all([
      this.publicacionModel
        .find(condicion)
        .sort(orden)
        .skip(filtros.offset)
        .limit(filtros.limit)
        .populate('autor', CAMPOS_AUTOR)
        .exec(),
      this.publicacionModel.countDocuments(condicion),
    ]);

    // Los últimos comentarios de TODAS las publicaciones de la página, en una sola consulta
    const adelantos = await this.ultimosComentarios(
      publicaciones.map((p) => p._id),
    );

    return {
      total,
      offset: filtros.offset,
      limit: filtros.limit,
      publicaciones: publicaciones.map((p) => ({
        ...this.paraRespuesta(p, usuario.sub),
        ultimosComentarios: adelantos.get(p._id.toString()) ?? [],
      })),
    };
  }

  /**
   * Para la tarjeta del listado: los 2 comentarios más recientes de cada publicación.
   * Una sola agregación para toda la página (y no una consulta por publicación):
   * 1) $match: solo los comentarios de esas publicaciones
   * 2) $sort: del más nuevo al más viejo
   * 3) $group: los junta por publicación (en ese orden)
   * 4) $project + $slice: se queda con los primeros 2 de cada una
   * Después populate completa el autor (Model.populate funciona sobre objetos planos).
   */
  private async ultimosComentarios(ids: Types.ObjectId[]) {
    const grupos = await this.comentarioModel.aggregate<{
      _id: Types.ObjectId;
      comentarios: Comentario[];
    }>([
      { $match: { publicacion: { $in: ids } } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $group: { _id: '$publicacion', comentarios: { $push: '$$ROOT' } } },
      {
        $project: {
          comentarios: { $slice: ['$comentarios', COMENTARIOS_ADELANTO] },
        },
      },
    ]);
    const porPublicacion = new Map<string, Comentario[]>();
    for (const grupo of grupos) {
      await this.comentarioModel.populate(grupo.comentarios, {
        path: 'autor',
        select: 'nombre apellido nombreUsuario fotoPerfil',
      });
      porPublicacion.set(grupo._id.toString(), grupo.comentarios.map(conAutor));
    }
    return porPublicacion;
  }

  /** Una sola publicación (la página de la publicación, con sus comentarios) */
  async obtener(id: string, usuario: DatosToken) {
    const publicacion = await this.publicacionModel
      .findOne({ _id: id, activa: true })
      .populate('autor', CAMPOS_AUTOR)
      .exec();
    if (!publicacion) {
      throw new NotFoundException('La publicación no existe');
    }
    return this.paraRespuesta(publicacion, usuario.sub);
  }

  /** Baja lógica: solo el autor o un administrador */
  async eliminar(id: string, usuario: DatosToken) {
    const publicacion = await this.publicacionModel.findOne({
      _id: id,
      activa: true,
    });
    if (!publicacion) {
      throw new NotFoundException('La publicación no existe');
    }
    const esAutor = publicacion.autor.toString() === usuario.sub;
    if (!esAutor && usuario.perfil !== 'administrador') {
      // 403 (y no 401): sabemos quién es, pero no tiene permiso para esto
      throw new ForbiddenException(
        'Solo el autor o un administrador pueden eliminar la publicación',
      );
    }
    publicacion.activa = false;
    await publicacion.save();
    return { mensaje: 'Publicación eliminada' };
  }

  async darMeGusta(id: string, usuario: DatosToken) {
    const idUsuario = new Types.ObjectId(usuario.sub);
    // Una sola operación atómica: solo actualiza si el usuario TODAVÍA no está en el array.
    // Así, aunque lleguen dos clicks juntos, nunca se cuenta dos veces.
    const resultado = await this.publicacionModel.findOneAndUpdate(
      { _id: id, activa: true, meGusta: { $ne: idUsuario } },
      { $push: { meGusta: idUsuario }, $inc: { cantidadMeGusta: 1 } },
      { new: true },
    );
    if (!resultado) {
      await this.verificarQueExiste(id);
      throw new ConflictException('Ya le diste me gusta a esta publicación');
    }
    return { cantidadMeGusta: resultado.cantidadMeGusta, meGustaMio: true };
  }

  async quitarMeGusta(id: string, usuario: DatosToken) {
    const idUsuario = new Types.ObjectId(usuario.sub);
    // Solo actualiza si el usuario SÍ está en el array (si no le había dado me gusta, no hay nada que sacar)
    const resultado = await this.publicacionModel.findOneAndUpdate(
      { _id: id, activa: true, meGusta: idUsuario },
      { $pull: { meGusta: idUsuario }, $inc: { cantidadMeGusta: -1 } },
      { new: true },
    );
    if (!resultado) {
      await this.verificarQueExiste(id);
      throw new ConflictException(
        'No le habías dado me gusta a esta publicación',
      );
    }
    return { cantidadMeGusta: resultado.cantidadMeGusta, meGustaMio: false };
  }

  /** Si la publicación no existe (o se dio de baja) -> 404 */
  private async verificarQueExiste(id: string) {
    const existe = await this.publicacionModel.exists({
      _id: id,
      activa: true,
    });
    if (!existe) {
      throw new NotFoundException('La publicación no existe');
    }
  }

  /**
   * Lo que se manda al front: no se manda la lista de quiénes dieron me gusta (puede ser larga y
   * es información de otros usuarios), solo el total y si el usuario que pregunta ya dio me gusta.
   */
  private paraRespuesta(publicacion: PublicacionDocument, idUsuario: string) {
    const {
      meGusta,
      activa: _activa,
      ...resto
    } = conAutor(publicacion.toJSON());
    return {
      ...resto,
      meGustaMio: meGusta.some((id) => id.toString() === idUsuario),
    };
  }
}
