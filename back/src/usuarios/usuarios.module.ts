import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArchivosModule } from '../archivos/archivos.module.js';
import { CuadrosModule } from '../cuadros/cuadros.module.js';
import { Usuario, UsuarioSchema } from './entities/usuario.entity.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';

// @Global: UsuariosService queda disponible en TODOS los módulos sin importarlo. Lo necesita el
// AuthGuard (que se usa en publicaciones, partidos, comentarios...) para mirar si el usuario
// del token sigue existiendo y está habilitado.
@Global()
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
