import { Module } from '@nestjs/common';
import { ArchivosModule } from '../archivos/archivos.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  // Auth no toca la base directamente: usa UsuariosService (exportado por UsuariosModule)
  imports: [UsuariosModule, ArchivosModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
