import { Directive, ElementRef, HostListener, inject, input, OnDestroy } from '@angular/core';

/**
 * Directiva propia (Sprint 4) — DE ATRIBUTO.
 *
 *   <img class="avatar" [src]="usuario.fotoPerfil" appImagenRespaldo [iniciales]="usuario | iniciales" />
 *   <img [src]="equipo.escudo" appImagenRespaldo />
 *   <img [src]="publicacion.imagen" appImagenRespaldo="sin-imagen.svg" />
 *
 * Qué hace: si una imagen NO SE PUEDE CARGAR (la borraron de Cloudinary, cambió la URL de
 * promiedos, no hay internet), en vez del ícono de "imagen rota":
 * - en la FOTO DE UNA PERSONA (se le pasa [iniciales]): muestra el círculo con sus iniciales,
 *   igual que cuando el usuario no subió foto. Así, sin foto o con la foto rota, se ve lo mismo.
 * - en cualquier otra imagen: pone una imagen de respaldo de la propia app (front/public):
 *   la que diga el atributo (ej. "sin-imagen.svg") o, si no dice nada, el escudo de Tribuna.
 *
 * (Si el usuario NO subió foto, fotoPerfil es null y el template ya muestra las iniciales con
 *  un @if, sin directiva. La directiva cubre el otro caso: hay una URL, pero la imagen no carga.)
 *
 * Piezas:
 * - @HostListener('error'): el navegador dispara "error" en el <img> cuando no puede cargarla.
 * - @HostListener('load'): si después carga bien (por ejemplo, cambió la foto), se deshace el reemplazo.
 * - ElementRef: el <img> real, para ocultarlo o cambiarle el src.
 * - input(): la imagen de respaldo (el valor del atributo) y las iniciales.
 * - ngOnDestroy: el círculo de iniciales lo agrega la directiva (no Angular), así que lo saca ella.
 */
@Directive({ selector: 'img[appImagenRespaldo]' })
export class ImagenRespaldoDirective implements OnDestroy {
  appImagenRespaldo = input('');
  iniciales = input('');
  private imagen = inject<ElementRef<HTMLImageElement>>(ElementRef);
  private circulo?: HTMLSpanElement;
  private yaReemplazada = false;

  @HostListener('error')
  alFallar() {
    const img = this.imagen.nativeElement;

    // Foto de una persona: en lugar de la imagen, el círculo con las iniciales
    if (this.iniciales()) {
      this.mostrarIniciales(img);
      return;
    }

    // Cualquier otra imagen: una de respaldo. Si también fallara la de respaldo, no se vuelve
    // a intentar (si no, cada error dispararía otro error: un bucle infinito)
    if (this.yaReemplazada) {
      return;
    }
    this.yaReemplazada = true;
    img.src = this.appImagenRespaldo() || 'escudo.svg';
    img.classList.add('imagen-respaldo'); // para darle otro estilo (sin recorte)
  }

  @HostListener('load')
  alCargar() {
    // La imagen cargó bien (por ejemplo, el usuario subió otra foto): se vuelve a mostrar
    if (this.circulo) {
      this.circulo.remove();
      this.circulo = undefined;
      this.imagen.nativeElement.style.display = '';
    }
  }

  ngOnDestroy() {
    this.circulo?.remove();
  }

  private mostrarIniciales(img: HTMLImageElement) {
    if (this.circulo) {
      this.circulo.textContent = this.iniciales();
      return;
    }
    const circulo = document.createElement('span');
    // Las mismas clases y el mismo atributo de estilos del componente (_ngcontent-...) que el <img>,
    // así el círculo toma el mismo tamaño y forma que tenía la foto
    circulo.className = img.className;
    for (const atributo of Array.from(img.attributes)) {
      if (atributo.name.startsWith('_ngcontent')) {
        circulo.setAttribute(atributo.name, '');
      }
    }
    const ancho = img.getAttribute('width');
    const alto = img.getAttribute('height');
    if (ancho) circulo.style.width = `${ancho}px`;
    if (alto) circulo.style.height = `${alto}px`;
    circulo.textContent = this.iniciales();
    circulo.setAttribute('aria-label', img.alt || 'Foto de perfil');

    // style.display y no el atributo hidden: la clase .avatar tiene display: grid y le ganaría a hidden
    img.style.display = 'none';
    img.after(circulo);
    this.circulo = circulo;
  }
}
