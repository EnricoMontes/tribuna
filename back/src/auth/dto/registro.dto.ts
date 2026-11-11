import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Recortar } from '../../comun/recortar.decorator.js';

// Mismas reglas que el formulario de Angular: el front valida para dar feedback rápido,
// el back vuelve a validar porque cualquiera puede llamar a la API sin pasar por el front.
export const REGEX_PASSWORD = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
export const REGEX_NOMBRE_USUARIO = /^[a-zA-Z0-9_.]{3,20}$/;

export class RegistroDto {
  @Recortar()
  @IsString({ message: 'El nombre es obligatorio' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres' })
  nombre: string;

  @Recortar()
  @IsString({ message: 'El apellido es obligatorio' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(50, { message: 'El apellido no puede superar los 50 caracteres' })
  apellido: string;

  // require_tld: exige la extensión después del dominio ("hincha@gmail" → 400; "hincha@gmail.com" → OK)
  @IsEmail(
    { require_tld: true },
    { message: 'El correo no tiene un formato válido' },
  )
  correo: string;

  @Matches(REGEX_NOMBRE_USUARIO, {
    message:
      'El nombre de usuario debe tener de 3 a 20 caracteres: letras, números, "_" o "."',
  })
  nombreUsuario: string;

  @Matches(REGEX_PASSWORD, {
    message:
      'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número',
  })
  password: string;

  @IsDateString({}, { message: 'La fecha de nacimiento no es válida' })
  fechaNacimiento: string;

  @Recortar()
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(200, {
    message: 'La descripción no puede superar los 200 caracteres',
  })
  descripcion?: string;

  // Id del cuadro en promiedos (opcional). Que exista lo valida AuthService contra CuadrosService.
  @IsOptional()
  @IsString({ message: 'El cuadro no es válido' })
  cuadroId?: string;

  // Llega como texto (multipart/form-data): @Type lo convierte a número antes de validar
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El número de camiseta tiene que ser un número entero' })
  @Min(1, { message: 'El número de camiseta va del 1 al 99' })
  @Max(99, { message: 'El número de camiseta va del 1 al 99' })
  numeroCamiseta?: number;
}
