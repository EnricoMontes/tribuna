import { IsIn } from 'class-validator';
import { PERFILES, type Perfil } from '../entities/usuario.entity.js';

// PATCH /usuarios/:id/perfil -> { "perfil": "administrador" } o { "perfil": "usuario" }
export class CambiarPerfilDto {
  @IsIn(PERFILES, {
    message: 'El perfil tiene que ser "usuario" o "administrador"',
  })
  perfil: Perfil;
}
