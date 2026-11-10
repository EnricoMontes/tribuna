import { Directive, HostListener, output } from '@angular/core';

/**
 * Directiva propia (Sprint 4) — DE ATRIBUTO, con un evento de salida.
 *
 *   <div class="fondo" (appEscape)="cerrar()">...</div>
 *
 * Qué hace: avisa cuando el usuario aprieta la tecla Escape, mientras ese elemento está en pantalla.
 *
 * Una directiva es como un componente SIN template: no dibuja nada propio, le agrega comportamiento
 * a un elemento que ya existe. Angular la "engancha" a todo elemento que coincida con el selector
 * [appEscape] (un atributo). Escribir (appEscape)="..." ya cuenta como tener ese atributo.
 *
 * - @HostListener('document:keydown.escape'): escucha el evento keydown de la tecla Escape en todo
 *   el documento (no solo cuando el foco está adentro del elemento).
 * - output(): el evento que emite la directiva. Es lo que se escucha con (appEscape)="...".
 *
 * Antes, el mismo @HostListener de Escape estaba COPIADO en 3 componentes (el modal de mensajes,
 * la ventana de editar perfil y la de nuevo usuario). Ahora la lógica está en un solo lugar.
 * Además, como la directiva vive mientras vive el elemento, solo escucha cuando la ventana está
 * abierta: si la ventana está en un @if cerrado, la directiva no existe y no escucha nada.
 */
@Directive({ selector: '[appEscape]' })
export class EscapeDirective {
  appEscape = output<void>();

  @HostListener('document:keydown.escape')
  alPresionarEscape() {
    this.appEscape.emit();
  }
}
