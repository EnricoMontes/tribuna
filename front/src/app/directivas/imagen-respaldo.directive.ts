import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

/**
 * Directiva propia (Sprint 4) — DE ATRIBUTO.
 *
 *   <img [src]="usuario.fotoPerfil" appImagenRespaldo />                       -> si falla, el escudo
 *   <img [src]="publicacion.imagen" appImagenRespaldo="sin-imagen.svg" />      -> si falla, otra imagen
 *
 * Qué hace: si una imagen no se puede cargar (la borraron de Cloudinary, la URL de promiedos cambió,
 * no hay internet), en vez del ícono de "imagen rota" pone una imagen de respaldo.
 *
 * - selector 'img[appImagenRespaldo]': solo se engancha a etiquetas <img> que tengan ese atributo.
 * - ElementRef: la referencia al elemento real del DOM donde está puesta (el <img>). Con
 *   inject(ElementRef) la directiva puede tocarlo directamente (cambiarle el src).
 * - @HostListener('error'): escucha el evento "error" del <img>, que el navegador dispara cuando
 *   no puede cargar la imagen.
 * - input(): el valor del atributo es la imagen de respaldo. Si se pone el atributo solo, sin valor,
 *   llega '' y se elige sola: en un avatar (clase "avatar"), el escudo sobre el azul noche;
 *   en cualquier otra (escudos de los equipos), el escudo de Tribuna.
 */
@Directive({ selector: 'img[appImagenRespaldo]' })
export class ImagenRespaldoDirective {
  appImagenRespaldo = input('');
  private imagen = inject<ElementRef<HTMLImageElement>>(ElementRef);
  private yaReemplazada = false;

  @HostListener('error')
  alFallar() {
    // Si también fallara la de respaldo, no se vuelve a intentar (si no, sería un bucle infinito)
    if (this.yaReemplazada) {
      return;
    }
    this.yaReemplazada = true;
    const img = this.imagen.nativeElement;
    const porDefecto = img.classList.contains('avatar') ? 'avatar-respaldo.svg' : 'escudo.svg';
    img.src = this.appImagenRespaldo() || porDefecto;
    img.classList.add('imagen-respaldo'); // para poder darle otro estilo (fondo, sin recorte)
  }
}
