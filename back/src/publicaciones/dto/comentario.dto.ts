import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Lo mismo para crear (POST) y editar (PUT): lo único que manda el usuario es el mensaje
export class ComentarioDto {
  @IsString({ message: 'El comentario es obligatorio' })
  @IsNotEmpty({ message: 'El comentario no puede estar vacío' })
  @MaxLength(500, {
    message: 'El comentario no puede superar los 500 caracteres',
  })
  mensaje: string;
}
