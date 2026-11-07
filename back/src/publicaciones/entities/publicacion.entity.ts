import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

export type PublicacionDocument = HydratedDocument<Publicacion>;

// Sub-schema de un equipo (sin _id propio): copia de lo que vino de promiedos
const equipo = { id: String, nombre: String, escudo: String, _id: false };

// collection: sin esto Mongoose pluraliza en inglés y la colección se llamaría "publicacions"
@Schema({ timestamps: true, versionKey: false, collection: 'publicaciones' })
export class Publicacion {
  @Prop({ required: true, trim: true })
  titulo: string;

  @Prop({ required: true, trim: true })
  mensaje: string;

  // URL de Cloudinary (la imagen es opcional)
  @Prop({ type: String, default: null })
  imagen: string | null;

  // ref + populate: en la base se guarda solo el _id del autor y al listar se "completa" con sus datos.
  // SchemaTypes.ObjectId (el TIPO de esquema) y no Types.ObjectId (la clase del valor): en Mongoose 9
  // Types.ObjectId acá deja el campo como "Mixed" y las búsquedas por id en texto no lo convierten.
  @Prop({ type: SchemaTypes.ObjectId, ref: Usuario.name, required: true })
  autor: Types.ObjectId;

  // Copia del partido al momento de publicar: si después cambia la fecha en promiedos, la publicación
  // sigue sabiendo de qué partido era (id, liga, equipos con escudo y horario)
  @Prop({
    type: {
      id: String,
      liga: String,
      fecha: String,
      local: equipo,
      visitante: equipo,
      inicio: Date,
      goles: { local: Number, visitante: Number, _id: false },
      _id: false,
    },
    required: true,
  })
  partido: {
    id: string;
    liga: string;
    fecha: string;
    local: { id: string; nombre: string; escudo: string };
    visitante: { id: string; nombre: string; escudo: string };
    inicio: Date;
    goles: { local: number; visitante: number };
  };

  // Quiénes dieron me gusta. Guardar los ids permite que cada usuario dé UN solo me gusta.
  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: Usuario.name }], default: [] })
  meGusta: Types.ObjectId[];

  // Contador aparte: Mongo no puede ordenar por el largo de un array con un simple sort,
  // así que se mantiene este número (+1 / -1) en la misma operación que agrega o saca el me gusta
  @Prop({ default: 0 })
  cantidadMeGusta: number;

  // Cuántos comentarios tiene (+1 al comentar), para mostrarlo en la tarjeta sin otra consulta
  @Prop({ default: 0 })
  cantidadComentarios: number;

  // Baja lógica: no se borra de la base, se marca como inactiva y deja de listarse
  @Prop({ default: true })
  activa: boolean;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);

// Índices para las consultas más comunes (listado por fecha o por me gusta, por partido y por autor)
PublicacionSchema.index({ activa: 1, createdAt: -1 });
PublicacionSchema.index({ activa: 1, cantidadMeGusta: -1 });
PublicacionSchema.index({ 'partido.id': 1 });
PublicacionSchema.index({ autor: 1 });
