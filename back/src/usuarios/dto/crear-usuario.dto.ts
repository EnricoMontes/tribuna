import { IsIn } from 'class-validator';
import { RegistroDto } from '../../auth/dto/registro.dto.js';
import { PERFILES, type Perfil } from '../entities/usuario.entity.js';

/**
 * POST /usuarios (solo administradores): los MISMOS datos que el registro + el perfil.
 * "extends RegistroDto" hereda todas las validaciones del registro (class-validator las respeta
 * en la clase hija), así que no se repite ninguna regla: solo se agrega el campo nuevo.
 * En el front, el perfil sale de los dos radio buttons "usuario" / "administrador".
 */
export class CrearUsuarioDto extends RegistroDto {
  @IsIn(PERFILES, {
    message: 'El perfil tiene que ser "usuario" o "administrador"',
  })
  perfil: Perfil;
}
