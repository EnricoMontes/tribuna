import { Directive, ElementRef, HostListener, inject, output } from '@angular/core';

/**
 * Directiva propia (Sprint 4) — DE ATRIBUTO, con un evento de salida.
 *
 *   <div class="buscador" (appClickAfuera)="cerrar()">...</div>
 *
 * Qué hace: avisa cuando el usuario hace click (o toca, en el celular) en cualquier lugar de la
 * página que esté AFUERA de ese elemento. Sirve para cerrar desplegables y menús.
 *
 * - @HostListener('document:pointerdown', ['$event']): escucha el click en todo el documento.
 *   pointerdown (y no click) para que también ande con el dedo y se cierre apenas se toca.
 * - ElementRef: el elemento real donde está puesta la directiva.
 * - elemento.contains(destino): ¿lo que se tocó está ADENTRO del elemento? Si no -> emite.
 * - output(): el evento que se escucha con (appClickAfuera)="...".
 *
 * Antes, el buscador de partidos tenía este código hecho a mano en el propio componente
 * (host: '(document:pointerdown)' + ElementRef.contains). Ahora es reutilizable.
 */
@Directive({ selector: '[appClickAfuera]' })
export class ClickAfueraDirective {
  appClickAfuera = output<void>();
  private elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  @HostListener('document:pointerdown', ['$event'])
  alTocarLaPagina(evento: PointerEvent) {
    if (!this.elemento.nativeElement.contains(evento.target as Node)) {
      this.appClickAfuera.emit();
    }
  }
}
