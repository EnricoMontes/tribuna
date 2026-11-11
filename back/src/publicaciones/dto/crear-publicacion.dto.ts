import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Recortar } from '../../comun/recortar.decorator.js';

// Llega como multipart/form-data (por la imagen). La imagen no está acá: la recibe FileInterceptor.
export class CrearPublicacionDto {
  @Recortar()
  @IsString({ message: 'El título es obligatorio' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(80, { message: 'El título no puede superar los 80 caracteres' })
  titulo: string;

  @Recortar()
  @IsString({ message: 'El mensaje es obligatorio' })
  @IsNotEmpty({ message: 'El mensaje es obligatorio' })
  @MaxLength(500, { message: 'El mensaje no puede superar los 500 caracteres' })
  mensaje: string;

  // Id del partido de promiedos. Que sea un partido ya jugado lo valida el service.
  @IsString({ message: 'Elegí el partido de la publicación' })
  @IsNotEmpty({ message: 'Elegí el partido de la publicación' })
  partidoId: string;
}
