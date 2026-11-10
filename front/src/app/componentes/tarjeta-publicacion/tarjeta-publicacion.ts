import { DatePipe } from '@angular/common';
import { Component, input, linkedSignal, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImagenRespaldoDirective } from '../../directivas/imagen-respaldo.directive';
import { Publicacion } from '../../modelos/publicacion';
import { InicialesPipe } from '../../pipes/iniciales.pipe';
import { PluralPipe } from '../../pipes/plural.pipe';
import { TiempoRelativoPipe } from '../../pipes/tiempo-relativo.pipe';
import { Comentarios } from '../comentarios/comentarios';

/**
 * Una publicación (la consigna pide que cada publicación sea un componente).
 * - input(): recibe los datos desde el padre (la lista, Mi perfil...).
 * - output(): avisa al padre cuando el usuario toca "me gusta" o "eliminar".
 *   La tarjeta NO llama a la API: solo muestra y avisa. El padre decide qué hacer
 *   (así la misma tarjeta sirve en cualquier pantalla).
 */
@Component({
  imports: [
    DatePipe,
    RouterLink,
    Comentarios,
    InicialesPipe,
    PluralPipe,
    TiempoRelativoPipe,
    ImagenRespaldoDirective,
  ],
  selector: 'app-tarjeta-publicacion',
  styleUrl: './tarjeta-publicacion.css',
  templateUrl: './tarjeta-publicacion.html',
})
export class TarjetaPublicacion {
  publicacion = input.required<Publicacion>();
  puedeEliminar = input(false); // el padre sabe si es mía o si soy administrador
  ocupado = input(false); // mientras se procesa un me gusta, el botón queda deshabilitado
  mostrarPartido = input(true); // en la página del partido no hace falta repetirlo
  conComentarios = input(false); // muestra los comentarios abajo (página de la publicación y Mi perfil)
  comentariosPorPagina = input(5);
  grande = input(false); // la página de la publicación la muestra "grande en la pantalla"

  meGusta = output<Publicacion>();
  eliminar = output<Publicacion>();

  // linkedSignal: arranca con el valor que vino de la API, se puede cambiar acá (al comentar) y
  // si llega otra publicación por el input vuelve a tomar el valor nuevo
  cantidadComentarios = linkedSignal(() => this.publicacion().cantidadComentarios ?? 0);
}
