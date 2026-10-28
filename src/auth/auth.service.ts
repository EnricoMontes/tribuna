import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ArchivosService } from '../archivos/archivos.service.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

const EDAD_MINIMA = 13;
const RONDAS_SALT = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly archivosService: ArchivosService,
  ) {}

  async registro(datos: RegistroDto, foto?: Express.Multer.File) {
    // 1) Reglas que el DTO no puede chequear solo
    this.validarFechaNacimiento(datos.fechaNacimiento);

    // 2) Correo y usuario únicos -> 409 Conflict (el dato es válido, pero choca con uno existente)
    if (await this.usuariosService.correoEnUso(datos.correo)) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }
    if (await this.usuariosService.nombreUsuarioEnUso(datos.nombreUsuario)) {
      throw new ConflictException('Ese nombre de usuario ya está en uso');
    }

    // 3) Recién ahora subimos la foto (así no quedan imágenes huérfanas si los datos estaban mal)
    const fotoPerfil = foto
      ? await this.archivosService.subirImagen(foto, 'perfiles')
      : null;

    // 4) Encriptar: bcrypt genera un "salt" aleatorio y hashea. El hash no se puede revertir.
    const password = await bcrypt.hash(datos.password, RONDAS_SALT);

    try {
      const usuario = await this.usuariosService.crear({
        ...datos,
        descripcion: datos.descripcion ?? '',
        fechaNacimiento: new Date(datos.fechaNacimiento),
        password,
        fotoPerfil,
      });
      return usuario.toJSON(); // toJSON borra la contraseña (ver usuario.entity.ts)
    } catch (error) {
      // Dos registros simultáneos con el mismo correo: lo frena el índice único de Mongo (código 11000)
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          'El correo o el nombre de usuario ya están en uso',
        );
      }
      throw error;
    }
  }

  async login({ identificador, password }: LoginDto) {
    const usuario = await this.usuariosService.buscarParaLogin(identificador);

    // bcrypt.compare encripta la contraseña recibida con el mismo salt del hash guardado y compara.
    // Mismo mensaje para "no existe" y "contraseña mal": no le damos pistas a un atacante.
    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    return usuario.toJSON();
  }

  private validarFechaNacimiento(fecha: string) {
    const nacimiento = new Date(fecha);
    const hoy = new Date();
    if (nacimiento > hoy) {
      throw new BadRequestException(
        'La fecha de nacimiento no puede ser futura',
      );
    }
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const cumpleEsteAnio = new Date(
      hoy.getFullYear(),
      nacimiento.getMonth(),
      nacimiento.getDate(),
    );
    if (hoy < cumpleEsteAnio) edad--;
    if (edad < EDAD_MINIMA) {
      throw new BadRequestException(
        `Tenés que tener al menos ${EDAD_MINIMA} años para registrarte`,
      );
    }
  }
}
