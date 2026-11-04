import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const PERFILES = ['usuario', 'administrador'] as const;
export type Perfil = (typeof PERFILES)[number];

export type UsuarioDocument = HydratedDocument<Usuario>;

// timestamps: Mongoose agrega createdAt / updatedAt solo
@Schema({ timestamps: true, versionKey: false })
export class Usuario {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, trim: true })
  apellido: string;

  // unique: crea un índice único en MongoDB -> no puede haber dos usuarios con el mismo correo
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  correo: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  nombreUsuario: string;

  // select: false -> la contraseña (hasheada) NO viene en las consultas, salvo que se pida con '+password'
  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true })
  fechaNacimiento: Date;

  @Prop({ trim: true, default: '' })
  descripcion: string;

  // URL de Cloudinary (null si no subió foto)
  @Prop({ type: String, default: null })
  fotoPerfil: string | null;

  // Por defecto "usuario". Un "administrador" se asigna desde la base (y en el sprint 4 desde el dashboard)
  @Prop({ type: String, enum: PERFILES, default: 'usuario' })
  perfil: Perfil;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);

// Cada vez que un usuario se convierte a JSON (o sea, cuando se manda en una respuesta)
// se borra la contraseña, por si en algún caso se cargó con '+password'.
UsuarioSchema.set('toJSON', {
  transform: (_doc, ret: Partial<Usuario>) => {
    delete ret.password;
    return ret;
  },
});
