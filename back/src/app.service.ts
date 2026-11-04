import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Ruta de "salud": sirve para ver que la API está viva (y para despertar Render)
  estado() {
    return { estado: 'ok', api: 'Tribuna' };
  }
}
