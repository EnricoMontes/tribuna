import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  // Auth no toca la base directamente: usa UsuariosService (exportado por UsuariosModule)
  imports: [
    UsuariosModule, // crearUsuario, buscarParaLogin, buscarPorId (la foto y el cuadro los maneja UsuariosService)
    // Como en el repo del profe, pero con registerAsync para leer el secreto del .env.
    // global: true -> JwtService queda disponible en todos los módulos (lo usa el AuthGuard).
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // La consigna pide 15 minutos ('15m'); el profe pidió 15 segundos para probarlo en vivo.
        signOptions: { expiresIn: '15s' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
