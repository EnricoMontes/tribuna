import { Directive, effect, inject, TemplateRef, ViewContainerRef } from '@angular/core';
import { Auth } from '../servicios/auth';

/**
 * Directiva propia (Sprint 4) — ESTRUCTURAL (como *ngIf). El asterisco es la clave.
 *
 *   <a *appSoloAdmin routerLink="/dashboard">Dashboard</a>
 *
 * Qué hace: el elemento existe SOLO si el usuario logueado es administrador.
 *
 * Una directiva de atributo modifica un elemento que ya está. Una ESTRUCTURAL decide si el
 * elemento se agrega o se saca del DOM. El * hace que Angular envuelva el elemento en un
 * <ng-template> (un "molde" que no se dibuja solo) y se lo pase a la directiva:
 * - TemplateRef: ese molde (el <a> con todo lo que tiene adentro).
 * - ViewContainerRef: el lugar del DOM donde se puede dibujar el molde.
 * - createEmbeddedView(molde): lo dibuja.  clear(): lo saca.
 *
 * effect(): se vuelve a ejecutar solo cada vez que cambia un signal que lee adentro (auth.esAdmin()).
 * Por eso, si un admin cierra sesión y entra un usuario común, el link desaparece sin recargar.
 *
 * Es solo para la interfaz: lo que de verdad protege es el AdminGuard del back (403).
 */
@Directive({ selector: '[appSoloAdmin]' })
export class SoloAdminDirective {
  private molde = inject(TemplateRef);
  private contenedor = inject(ViewContainerRef);
  private auth = inject(Auth);
  private dibujado = false;

  constructor() {
    effect(() => {
      const esAdmin = this.auth.esAdmin();
      if (esAdmin && !this.dibujado) {
        this.contenedor.createEmbeddedView(this.molde);
        this.dibujado = true;
      } else if (!esAdmin && this.dibujado) {
        this.contenedor.clear();
        this.dibujado = false;
      }
    });
  }
}
