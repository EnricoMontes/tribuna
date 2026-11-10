import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe propia (Sprint 4): un número con la palabra en singular o en plural.
 *   {{ 1 | plural: 'comentario' }}                        ->  "1 comentario"
 *   {{ 3 | plural: 'comentario' }}                        ->  "3 comentarios"   (agrega "s")
 *   {{ 5 | plural: 'publicación' : 'publicaciones' }}     ->  "5 publicaciones" (plural irregular)
 *
 * Reemplaza los "cantidad === 1 ? 'comentario' : 'comentarios'" que estaban repetidos en los templates.
 * Los parámetros van después de los dos puntos: el primero es el singular, el segundo (opcional) el plural.
 */
@Pipe({ name: 'plural' })
export class PluralPipe implements PipeTransform {
  transform(cantidad: number | null | undefined, singular: string, plural?: string): string {
    const n = cantidad ?? 0;
    return `${n} ${n === 1 ? singular : (plural ?? `${singular}s`)}`;
  }
}
