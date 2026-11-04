import { Partido } from './partido';
import { Usuario } from './usuario';

export type Orden = 'fecha' | 'meGusta';

// Lo que devuelve la API por cada publicación
export interface Publicacion {
  _id: string;
  titulo: string;
  mensaje: string;
  imagen: string | null;
  autor: Pick<Usuario, '_id' | 'nombre' | 'apellido' | 'nombreUsuario' | 'fotoPerfil' | 'cuadro'>;
  partido: Partido;
  cantidadMeGusta: number;
  meGustaMio: boolean; // si el usuario logueado ya le dio me gusta
  createdAt: string;
  updatedAt: string;
}

// GET /publicaciones devuelve una "página" + el total (para calcular cuántas páginas hay)
export interface PaginaPublicaciones {
  total: number;
  offset: number;
  limit: number;
  publicaciones: Publicacion[];
}

export interface FiltrosPublicaciones {
  orden?: Orden;
  offset?: number;
  limit?: number;
  usuario?: string;
  partido?: string;
}
