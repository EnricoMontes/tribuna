import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { DatosToken } from '../auth/guards/auth.guard.js';
import { conAutor } from './autor-eliminado.js';
import { ComentarioDto } from './dto/comentario.dto.js';
import { PaginacionDto } from './dto/paginacion.dto.js';
import {
  Comentario,
  ComentarioDocument,
} from './entities/comentario.entity.js';
import {
  Publicacion,
  PublicacionDocument,
} from './entities/publicacion.entity.js';

// Datos del autor que se muestran en cada comentario (nunca la contraseña ni el correo)
const CAMPOS_AUTOR = 'nombre apellido nombreUsuario fotoPerfil';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(Comentario.name)
    private readonly comentarioModel: Model<ComentarioDocument>,
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<PublicacionDocument>,
  ) {}

  /** POST: agrega un comentario a la publicación, con el usuario (del token) y la fecha (createdAt) */
  async crear(
    idPublicacion: string,
    datos: ComentarioDto,
    usuario: DatosToken,
  ) {
    await this.verificarPublicacion(idPublicacion);
    const comentario = await this.comentarioModel.create({
      mensaje: datos.mensaje,
      autor: new Types.ObjectId(usuario.sub), // el autor sale del TOKEN, no del body
      publicacion: new Types.ObjectId(idPublicacion),
    });
    // Contador en la publicación (como cantidadMeGusta): la tarjeta muestra cuántos comentarios
    // tiene sin tener que contarlos en otra consulta
    await this.publicacionModel.updateOne(
      { _id: idPublicacion },
      { $inc: { cantidadComentarios: 1 } },
    );
    await comentario.populate('autor', CAMPOS_AUTOR);
    return comentario.toJSON();
  }

  /** GET: los comentarios de una publicación, paginados y los más recientes primero */
  async listar(idPublicacion: string, { offset, limit }: PaginacionDto) {
    await this.verificarPublicacion(idPublicacion);
    const condicion = { publicacion: new Types.ObjectId(idPublicacion) };

    // La página pedida y el total a la vez (el front usa el total para saber si muestra "cargar más")
    const [comentarios, total] = await Promise.all([
      this.comentarioModel
        .find(condicion)
        .sort({ createdAt: -1, _id: -1 }) // _id desempata si dos tienen la misma fecha
        .skip(offset)
        .limit(limit)
        .populate('autor', CAMPOS_AUTOR)
        .exec(),
      this.comentarioModel.countDocuments(condicion),
    ]);

    return {
      total,
      offset,
      limit,
      comentarios: comentarios.map((c) => conAutor(c.toJSON())),
    };
  }

  /** PUT: cambia el mensaje y marca modificado: true. Solo el autor del comentario. */
  async editar(
    idPublicacion: string,
    idComentario: string,
    datos: ComentarioDto,
    usuario: DatosToken,
  ) {
    await this.verificarPublicacion(idPublicacion);
    const comentario = await this.comentarioModel.findOne({
      _id: idComentario,
      publicacion: idPublicacion, // tiene que ser un comentario DE esa publicación
    });
    if (!comentario) {
      throw new NotFoundException('El comentario no existe');
    }
    if (comentario.autor.toString() !== usuario.sub) {
      // 403 (y no 401): sabemos quién es, pero no es el autor
      throw new ForbiddenException('Solo el autor puede editar su comentario');
    }
    comentario.mensaje = datos.mensaje;
    comentario.modificado = true; // lo marca el back: el cliente no puede mandarlo
    await comentario.save();
    await comentario.populate('autor', CAMPOS_AUTOR);
    return comentario.toJSON();
  }

  /**
   * La publicación tiene que existir y no estar dada de baja -> si no, 404.
   * Así, cuando se da de baja una publicación, sus comentarios dejan de estar disponibles.
   */
  private async verificarPublicacion(id: string) {
    const existe = await this.publicacionModel.exists({
      _id: id,
      activa: true,
    });
    if (!existe) {
      throw new NotFoundException('La publicación no existe');
    }
  }
}
