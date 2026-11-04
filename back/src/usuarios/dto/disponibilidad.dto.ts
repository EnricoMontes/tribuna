import { IsIn, IsNotEmpty, IsString } from 'class-validator';

// GET /usuarios/disponibilidad?campo=correo&valor=juan@mail.com
export class DisponibilidadDto {
  @IsIn(['correo', 'nombreUsuario'], {
    message: 'El campo debe ser "correo" o "nombreUsuario"',
  })
  campo: 'correo' | 'nombreUsuario';

  @IsString({ message: 'Falta el valor a consultar' })
  @IsNotEmpty({ message: 'Falta el valor a consultar' })
  valor: string;
}
