import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Recortar } from '../../comun/recortar.decorator.js';

// Un texto vacío ('') en un campo opcional significa "sacarlo" -> se convierte en null
const vacioANull = ({ value }: { value: unknown }) =>
  value === '' ? null : value;

/**
 * PATCH /usuarios/mi-perfil (multipart/form-data, por las imágenes).
 * Todo es opcional: solo se cambia lo que se manda (por eso es PATCH y no PUT).
 * Correo, nombre de usuario, contraseña y fecha de nacimiento no se editan acá.
 */
export class EditarPerfilDto {
  @Recortar()
  @IsOptional()
  @IsString({ message: 'El nombre es obligatorio' })
  @IsNotEmpty({ message: 'El nombre no puede quedar vacío' })
  @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres' })
  nombre?: string;

  @Recortar()
  @IsOptional()
  @IsString({ message: 'El apellido es obligatorio' })
  @IsNotEmpty({ message: 'El apellido no puede quedar vacío' })
  @MaxLength(50, { message: 'El apellido no puede superar los 50 caracteres' })
  apellido?: string;

  @Recortar()
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(200, {
    message: 'La descripción no puede superar los 200 caracteres',
  })
  descripcion?: string;

  // '' = dejar de ser hincha de un cuadro (null). Que el id exista lo valida el service.
  @IsOptional()
  @Transform(vacioANull)
  @IsString({ message: 'El cuadro no es válido' })
  cuadroId?: string | null;

  // '' = sacar el número (null). Llega como texto (multipart): se convierte a número.
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' || value === null ? null : Number(value),
  )
  @IsInt({ message: 'El número de camiseta tiene que ser un número entero' })
  @Min(1, { message: 'El número de camiseta va del 1 al 99' })
  @Max(99, { message: 'El número de camiseta va del 1 al 99' })
  numeroCamiseta?: number | null;

  // "true" = sacar la foto de perfil / el banner (vuelven a las iniciales / a la portada azul)
  @IsOptional()
  @IsIn(['true', 'false'], {
    message: 'quitarFotoPerfil tiene que ser true o false',
  })
  quitarFotoPerfil?: string;

  @IsOptional()
  @IsIn(['true', 'false'], {
    message: 'quitarBanner tiene que ser true o false',
  })
  quitarBanner?: string;
}
