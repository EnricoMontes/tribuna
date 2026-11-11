/**
 * Si el autor de una publicación o de un comentario ya no existe en la base (por ejemplo, lo
 * borraron a mano desde Atlas), populate deja autor: null y el front se rompía al leer
 * autor.nombre. La API nunca manda null: manda este autor "de reemplazo".
 */
export const AUTOR_ELIMINADO = {
  _id: null,
  nombre: 'Usuario',
  apellido: 'eliminado',
  nombreUsuario: 'eliminado',
  fotoPerfil: null,
  cuadro: null,
};

/** Devuelve el mismo objeto, pero con AUTOR_ELIMINADO si el autor quedó en null */
export function conAutor<T extends { autor?: unknown }>(item: T): T {
  return item.autor ? item : { ...item, autor: AUTOR_ELIMINADO };
}
