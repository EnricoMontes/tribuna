import { Controller, Get, Query } from '@nestjs/common';
import { DisponibilidadDto } from './dto/disponibilidad.dto.js';
import { UsuariosService } from './usuarios.service.js';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // La usa el validador asíncrono del registro en Angular para avisar "ese correo ya existe"
  // mientras el usuario escribe. (El listado/alta/baja para administradores llega en el sprint 4.)
  @Get('disponibilidad')
  async disponibilidad(@Query() { campo, valor }: DisponibilidadDto) {
    const enUso =
      campo === 'correo'
        ? await this.usuariosService.correoEnUso(valor)
        : await this.usuariosService.nombreUsuarioEnUso(valor);
    return { disponible: !enUso };
  }
}
