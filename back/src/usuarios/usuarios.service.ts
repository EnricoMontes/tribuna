import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './entities/usuario.entity.js';

// Lógica de acceso a la colección "usuarios". La usa AuthModule (por eso el módulo exporta este servicio).
@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  crear(datos: Omit<Usuario, 'perfil'>) {
    return this.usuarioModel.create(datos);
  }

  /** Para el login: busca por correo O por nombre de usuario, trayendo también la contraseña hasheada. */
  buscarParaLogin(identificador: string) {
    const valor = identificador.trim().toLowerCase();
    return this.usuarioModel
      .findOne({ $or: [{ correo: valor }, { nombreUsuario: valor }] })
      .select('+password')
      .exec();
  }

  async correoEnUso(correo: string) {
    return (
      (await this.usuarioModel.exists({
        correo: correo.trim().toLowerCase(),
      })) !== null
    );
  }

  async nombreUsuarioEnUso(nombreUsuario: string) {
    return (
      (await this.usuarioModel.exists({
        nombreUsuario: nombreUsuario.trim().toLowerCase(),
      })) !== null
    );
  }
}
