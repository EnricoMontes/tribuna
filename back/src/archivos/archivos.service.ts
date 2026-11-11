import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

/**
 * ¿El archivo ES una imagen? El tipo (image/png) lo declara el navegador y se puede falsificar:
 * un .txt renombrado a .png llega como image/png. Por eso se miran los primeros bytes, la
 * "firma" (magic number) que tiene cada formato al principio del archivo:
 * - JPG:  FF D8 FF
 * - PNG:  89 50 4E 47 0D 0A 1A 0A  ("PNG


")
 * - WEBP: "RIFF" + 4 bytes de tamaño + "WEBP"
 */
export function esImagenReal(buffer: Buffer): boolean {
  const empiezaCon = (bytes: number[], desde = 0) =>
    bytes.every((byte, i) => buffer[desde + i] === byte);
  const jpg = empiezaCon([0xff, 0xd8, 0xff]);
  const png = empiezaCon([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webp =
    buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buffer.subarray(8, 12).toString('latin1') === 'WEBP';
  return jpg || png || webp;
}

// Sube imágenes a Cloudinary y devuelve la URL pública (basado en el FileService de la clase).
@Injectable()
export class ArchivosService {
  private readonly configurado: boolean;

  constructor(config: ConfigService) {
    const cloud_name = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const api_key = config.get<string>('CLOUDINARY_API_KEY');
    const api_secret = config.get<string>('CLOUDINARY_API_SECRET');
    this.configurado = Boolean(cloud_name && api_key && api_secret);
    // Las credenciales salen del .env, nunca escritas en el código
    cloudinary.config({ cloud_name, api_key, api_secret });
  }

  subirImagen(archivo: Express.Multer.File, carpeta: string): Promise<string> {
    if (!this.configurado) {
      return Promise.reject(
        new InternalServerErrorException(
          'El servidor no tiene configurado Cloudinary',
        ),
      );
    }

    // Si no es una imagen de verdad -> 400 (antes llegaba a Cloudinary, que la rechazaba, y salía 500)
    if (!esImagenReal(archivo.buffer)) {
      return Promise.reject(
        new BadRequestException(
          'El archivo no es una imagen válida (tiene que ser JPG, PNG o WEBP)',
        ),
      );
    }

    return new Promise<string>((resolve, reject) => {
      // upload_stream: manda el archivo que Multer dejó en memoria (archivo.buffer) sin guardarlo en disco.
      // No se pasa public_id: Cloudinary genera un nombre único y no se pisan dos fotos "perfil.jpg".
      const stream = cloudinary.uploader.upload_stream(
        { folder: `tribuna/${carpeta}`, resource_type: 'image' },
        (error, resultado) => {
          // Cloudinary responde 400 si la imagen está dañada (tiene la firma pero no se puede leer):
          // eso es un problema del archivo que mandaron -> 400. Cualquier otro error es nuestro -> 500.
          if (error?.http_code === 400) {
            reject(
              new BadRequestException(
                'La imagen está dañada o no se puede leer',
              ),
            );
          } else if (error || !resultado?.secure_url) {
            reject(
              new InternalServerErrorException('No se pudo guardar la imagen'),
            );
          } else {
            resolve(resultado.secure_url);
          }
        },
      );
      stream.on('error', () =>
        reject(new InternalServerErrorException('No se pudo enviar la imagen')),
      );
      stream.end(archivo.buffer);
    });
  }
}
