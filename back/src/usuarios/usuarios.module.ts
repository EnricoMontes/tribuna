import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArchivosModule } from '../archivos/archivos.module.js';
import { CuadrosModule } from '../cuadros/cuadros.module.js';
import { Usuario, UsuarioSchema } from './entities/usuario.entity.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
  // forFeature registra el modelo "Usuario" para poder inyectarlo con @InjectModel
  imports: [
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
    ArchivosModule, // subir la foto de perfil y el banner a Cloudinary
    CuadrosModule, // validar el cuadro elegido al editar el perfil
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  // Se exporta para que AuthModule pueda inyectar UsuariosService
  exports: [UsuariosService],
})
export class UsuariosModule {}
