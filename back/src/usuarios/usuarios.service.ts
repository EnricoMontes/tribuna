import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, QueryFilter } from 'mongoose';
import { ArchivosService } from '../archivos/archivos.service.js';
import type { RegistroDto } from '../auth/dto/registro.dto.js';
import { CuadrosService } from '../cuadros/cuadros.service.js';
import { EditarPerfilDto } from './dto/editar-perfil.dto.js';
import {
  ESTADOS,
  type Estado,
  ListarUsuariosDto,
} from './dto/listar-usuarios.dto.js';
import {
  type Perfil,
  Usuario,
  UsuarioDocument,
} from './entities/usuario.entity.js';

export interface ImagenesPerfil {
  fotoPerfil?: Express.Multer.File[];
  banner?: Express.Multer.File[];
}

const EDAD_MINIMA = 13;
const EDAD_MAXIMA = 100;
const RONDAS_SALT = 10;

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
   * Crea un usuario nuevo. La usan DOS rutas:
   * - POST /auth/registro (alguien se registra solo) -> perfil "usuario" siempre.
   * - POST /usuarios (un administrador lo da de alta) -> perfil elegido con los radio buttons.
   * Por eso vive acá y no en AuthService: las validaciones, la foto y el hash son los mismos.
   */
  async crearUsuario(
    datos: RegistroDto,
    foto?: Express.Multer.File,
    perfil: Perfil = 'usuario',
  ) {
    // 1) Reglas que el DTO no puede chequear solo
    this.validarFechaNacimiento(datos.fechaNacimiento);

    // 2) Correo y usuario únicos -> 409 Conflict (el dato es válido, pero choca con uno existente)
    if (await this.correoEnUso(datos.correo)) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }
    if (await this.nombreUsuarioEnUso(datos.nombreUsuario)) {
      throw new ConflictException('Ese nombre de usuario ya está en uso');
    }

    // El cuadro es opcional, pero si viene tiene que existir en la lista -> si no, 400
    const { cuadroId, ...resto } = datos;
    const cuadro = cuadroId ? await this.cuadrosService.buscar(cuadroId) : null;
    if (cuadroId && !cuadro) {
      throw new BadRequestException('El cuadro elegido no existe');
    }

    // 3) Recién ahora subimos la foto (así no quedan imágenes huérfanas si los datos estaban mal)
    const fotoPerfil = foto
      ? await this.archivosService.subirImagen(foto, 'perfiles')
      : null;

    // 4) Encriptar: bcrypt genera un "salt" aleatorio y hashea. El hash no se puede revertir.
    const password = await bcrypt.hash(datos.password, RONDAS_SALT);

    try {
      return await this.usuarioModel.create({
        ...resto,
        descripcion: datos.descripcion ?? '',
        cuadro,
        numeroCamiseta: datos.numeroCamiseta ?? null,
        fechaNacimiento: new Date(datos.fechaNacimiento),
        password,
        fotoPerfil,
        // Va DESPUÉS de "...resto": si alguien manda perfil=administrador en el body del
        // registro, este valor lo pisa. El perfil lo decide el parámetro, nunca el usuario.
        perfil,
        habilitado: true,
      });
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

  /**
   * GET /usuarios (admin): paginado, filtrado por estado/perfil y con búsqueda, los más nuevos primero.
   * Además del total para paginar, devuelve cuántos hay en cada filtro (los números de los chips),
   * contando con la búsqueda aplicada. Todas las consultas van a la vez con Promise.all.
   */
  async listar({ offset, limit, estado, buscar }: ListarUsuariosDto) {
    const base: QueryFilter<UsuarioDocument> = {};
    const texto = buscar?.trim();
    if (texto) {
      // Se escapan los caracteres especiales: así "a.b" busca el punto literal y nadie puede
      // mandar una expresión regular rara. "i" = sin distinguir mayúsculas.
      const patron = new RegExp(
        texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );
      base.$or = [
        { nombre: patron },
        { apellido: patron },
        { nombreUsuario: patron },
        { correo: patron },
      ];
    }

    // Un filtro por cada chip. "habilitados" usa $ne: false para incluir a los usuarios viejos,
    // que no tienen el campo guardado en la base.
    const filtros: Record<Estado, QueryFilter<UsuarioDocument>> = {
      todos: base,
      habilitados: { ...base, habilitado: { $ne: false } },
      deshabilitados: { ...base, habilitado: false },
      administradores: { ...base, perfil: 'administrador' },
    };

    const [usuarios, ...cantidades] = await Promise.all([
      this.usuarioModel
        .find(filtros[estado])
        .sort({ createdAt: -1, _id: -1 }) // _id desempata: el orden no cambia entre páginas
        .skip(offset)
        .limit(limit)
        .exec(),
      ...ESTADOS.map((e) => this.usuarioModel.countDocuments(filtros[e])),
    ]);
    const contadores = Object.fromEntries(
      ESTADOS.map((e, i) => [e, cantidades[i]]),
    ) as Record<Estado, number>;

    return { usuarios, total: contadores[estado], offset, limit, contadores };
  }

  /**
   * PATCH /usuarios/:id/perfil (admin): pasa un usuario a administrador o al revés.
   * El rol también viaja en el token: el cambio vale cuando esa persona vuelve a iniciar sesión.
   */
  async cambiarPerfil(id: string, perfil: Perfil, idAdmin: string) {
    // Si un admin se quitara el rol a sí mismo podría quedar la app sin ningún administrador
    if (id === idAdmin && perfil !== 'administrador') {
      throw new BadRequestException(
        'No podés quitarte el rol de administrador a vos mismo',
      );
    }
    const usuario = await this.usuarioModel
      .findByIdAndUpdate(id, { perfil }, { new: true })
      .exec();
    if (!usuario) {
      throw new NotFoundException('El usuario no existe');
    }
    return usuario;
  }

  /**
   * DELETE /usuarios/:id (baja lógica) y POST /usuarios/:id/habilitar (alta lógica).
   * No se borra nada: solo cambia "habilitado". Así se puede volver atrás y sus
   * publicaciones, me gusta y comentarios siguen existiendo.
   */
  async cambiarHabilitado(id: string, habilitado: boolean, idAdmin: string) {
    // Un admin no se puede deshabilitar a sí mismo (se quedaría afuera, y si es el único, nadie entra más)
    if (!habilitado && id === idAdmin) {
      throw new BadRequestException('No podés deshabilitar tu propia cuenta');
    }
    const usuario = await this.usuarioModel
      .findByIdAndUpdate(id, { habilitado }, { new: true })
      .exec();
    if (!usuario) {
      throw new NotFoundException('El usuario no existe');
    }
    return usuario;
  }

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

  /** Para el login: busca por correo O por nombre de usuario, trayendo también la contraseña hasheada. */
  buscarParaLogin(identificador: string) {
    const valor = identificador.trim().toLowerCase();
    return this.usuarioModel
      .findOne({ $or: [{ correo: valor }, { nombreUsuario: valor }] })
      .select('+password')
      .exec();
  }

  /**
   * Para el AuthGuard (en CADA petición con token): solo trae "habilitado", sin los demás datos,
   * y lean() devuelve un objeto plano (más liviano que un documento de Mongoose).
   * null = el usuario ya no existe.
   */
  estadoParaSesion(id: string) {
    return this.usuarioModel
      .findById(id)
      .select('habilitado')
      .lean<{ habilitado?: boolean }>()
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

  private validarFechaNacimiento(fecha: string) {
    const nacimiento = new Date(fecha);
    // Un día que no existe (31/02) JavaScript lo "corre" al mes siguiente (2 o 3 de marzo).
    // Se detecta comparando el día que quedó con el que se mandó.
    const dia = /^\d{4}-\d{2}-\d{2}/.exec(fecha)?.[0];
    if (
      Number.isNaN(nacimiento.getTime()) ||
      (dia && new Date(`${dia}T00:00:00Z`).toISOString().slice(0, 10) !== dia)
    ) {
      throw new BadRequestException('La fecha de nacimiento no existe');
    }
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
    if (edad > EDAD_MAXIMA) {
      throw new BadRequestException(
        `La fecha de nacimiento no es válida (más de ${EDAD_MAXIMA} años)`,
      );
    }
    if (edad < EDAD_MINIMA) {
      throw new BadRequestException(
        `Tenés que tener al menos ${EDAD_MINIMA} años para registrarte`,
      );
    }
  }
}
