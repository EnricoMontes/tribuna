import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  // Puede ser el correo o el nombre de usuario (los dos son únicos en la base)
  @IsString({ message: 'Ingresá tu correo o nombre de usuario' })
  @IsNotEmpty({ message: 'Ingresá tu correo o nombre de usuario' })
  identificador: string;

  @IsString({ message: 'Ingresá tu contraseña' })
  @IsNotEmpty({ message: 'Ingresá tu contraseña' })
  password: string;
}
