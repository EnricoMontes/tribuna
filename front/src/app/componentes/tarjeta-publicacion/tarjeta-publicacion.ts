import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Publicacion } from '../../modelos/publicacion';

/**
 * Una publicación (la consigna pide que cada publicación sea un componente).
 * - input(): recibe los datos desde el padre (la lista, Mi perfil...).
 * - output(): avisa al padre cuando el usuario toca "me gusta" o "eliminar".
 *   La tarjeta NO llama a la API: solo muestra y avisa. El padre decide qué hacer
 *   (así la misma tarjeta sirve en cualquier pantalla).
 */
@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-tarjeta-publicacion',
  styleUrl: './tarjeta-publicacion.css',
  templateUrl: './tarjeta-publicacion.html',
})
export class TarjetaPublicacion {
  publicacion = input.required<Publicacion>();
  puedeEliminar = input(false); // el padre sabe si es mía o si soy administrador
  ocupado = input(false); // mientras se procesa un me gusta, el botón queda deshabilitado
  mostrarPartido = input(true); // en la página del partido no hace falta repetirlo

  meGusta = output<Publicacion>();
  eliminar = output<Publicacion>();

  iniciales = computed(() => {
    const { nombre, apellido } = this.publicacion().autor;
    return `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase();
  });
}
