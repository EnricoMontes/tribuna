import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { Publicacion } from './publicacion.entity.js';

export type ComentarioDocument = HydratedDocument<Comentario>;

/**
 * Colección aparte (y no un array adentro de la publicación) porque:
 * - se pagina fácil (skip/limit con un índice),
 * - la publicación no crece sin límite (Mongo corta los documentos en 16 MB),
 * - para listar publicaciones no hace falta traer todos sus comentarios.
 * timestamps: createdAt es "la fecha" del comentario que pide la consigna.
 */
@Schema({ timestamps: true, versionKey: false, collection: 'comentarios' })
export class Comentario {
  @Prop({ required: true, trim: true })
  mensaje: string;

  // El autor sale del token (nunca del body). Al listar se completa con populate.
  @Prop({ type: SchemaTypes.ObjectId, ref: Usuario.name, required: true })
  autor: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: Publicacion.name, required: true })
  publicacion: Types.ObjectId;

  // La consigna: "agrega el atributo modificado: true para marcar que el comentario se modificó"
  @Prop({ default: false })
  modificado: boolean;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);

// Los comentarios de UNA publicación, del más nuevo al más viejo: la consulta del GET paginado
ComentarioSchema.index({ publicacion: 1, createdAt: -1 });
