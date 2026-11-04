import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

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

    return new Promise<string>((resolve, reject) => {
      // upload_stream: manda el archivo que Multer dejó en memoria (archivo.buffer) sin guardarlo en disco.
      // No se pasa public_id: Cloudinary genera un nombre único y no se pisan dos fotos "perfil.jpg".
      const stream = cloudinary.uploader.upload_stream(
        { folder: `tribuna/${carpeta}`, resource_type: 'image' },
        (error, resultado) => {
          if (error || !resultado?.secure_url) {
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
