import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import { memoryStorage } from 'multer';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
export const TAMANIO_MAXIMO_MB = 2;

// Opciones de Multer para cualquier campo de imagen:
// - memoryStorage: el archivo queda en memoria (buffer) para mandarlo directo a Cloudinary
// - limits: si pesa más de 2 MB, Nest responde 413 Payload Too Large
// - fileFilter: si no es jpg/png/webp, responde 400 Bad Request
export const opcionesImagen: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: TAMANIO_MAXIMO_MB * 1024 * 1024 },
  fileFilter: (_req, archivo, callback) => {
    if (TIPOS_PERMITIDOS.includes(archivo.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException('La imagen debe ser JPG, PNG o WEBP'),
        false,
      );
    }
  },
};
