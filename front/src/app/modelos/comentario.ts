import { Usuario } from './usuario';

// Lo que devuelve la API por cada comentario
export interface Comentario {
  _id: string;
  mensaje: string;
  autor: Pick<Usuario, '_id' | 'nombre' | 'apellido' | 'nombreUsuario' | 'fotoPerfil'>;
  publicacion: string;
  modificado: boolean; // true si el autor lo editó: se muestra "(editado)"
  createdAt: string;
  updatedAt: string;
}

// GET /publicaciones/:id/comentarios devuelve una "página" + el total
export interface PaginaComentarios {
  total: number;
  offset: number;
  limit: number;
  comentarios: Comentario[];
}
