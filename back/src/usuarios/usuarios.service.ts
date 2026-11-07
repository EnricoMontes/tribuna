import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ArchivosService } from '../archivos/archivos.service.js';
import { CuadrosService } from '../cuadros/cuadros.service.js';
import { EditarPerfilDto } from './dto/editar-perfil.dto.js';
import { Usuario, UsuarioDocument } from './entities/usuario.entity.js';

export interface ImagenesPerfil {
  fotoPerfil?: Express.Multer.File[];
  banner?: Express.Multer.File[];
}

// Lógica de acceso a la colección "usuarios". La usa AuthModule (por eso el módulo exporta este servicio).
@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
    private readonly archivosService: ArchivosService,
    private readonly cuadrosService: CuadrosService,
  ) {}

  /**
   * Edita el perfil del usuario logueado (el id sale del token, nunca del body).
   * Solo cambia lo que llega. Las imágenes se suben a Cloudinary recién cuando los datos están bien.
   */
  async editarPerfil(
    id: string,
    datos: EditarPerfilDto,
    imagenes: ImagenesPerfil = {},
  ) {
    const usuario = await this.usuarioModel.findById(id);
    if (!usuario) {
      throw new NotFoundException('El usuario no existe');
    }

    if (datos.nombre !== undefined) usuario.nombre = datos.nombre;
    if (datos.apellido !== undefined) usuario.apellido = datos.apellido;
    if (datos.descripcion !== undefined)
      usuario.descripcion = datos.descripcion;
    if (datos.numeroCamiseta !== undefined) {
      usuario.numeroCamiseta = datos.numeroCamiseta; // null = sacar el número
    }

    // Cuadro: null = ya no es hincha de ninguno; un id = tiene que existir en la lista -> si no, 400
    if (datos.cuadroId !== undefined) {
      if (datos.cuadroId === null) {
        usuario.cuadro = null;
      } else {
        const cuadro = await this.cuadrosService.buscar(datos.cuadroId);
        if (!cuadro) {
          throw new BadRequestException('El cuadro elegido no existe');
        }
        usuario.cuadro = cuadro;
      }
    }

    if (datos.quitarFotoPerfil === 'true') usuario.fotoPerfil = null;
    if (datos.quitarBanner === 'true') usuario.banner = null;

    const [foto] = imagenes.fotoPerfil ?? [];
    const [banner] = imagenes.banner ?? [];
    if (foto) {
      usuario.fotoPerfil = await this.archivosService.subirImagen(
        foto,
        'perfiles',
      );
    }
    if (banner) {
      usuario.banner = await this.archivosService.subirImagen(
        banner,
        'banners',
      );
    }

    await usuario.save();
    return usuario.toJSON(); // sin la contraseña
  }

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

  /** Para /auth/autorizar: los datos del usuario del token (sin la contraseña, que tiene select: false) */
  buscarPorId(id: string) {
    return this.usuarioModel.findById(id).exec();
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
