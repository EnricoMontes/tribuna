import { Component, ElementRef, HostListener, effect, viewChild } from '@angular/core';
import { Modal } from '../../servicios/modal';

// Dibuja el mensaje que pidió el servicio Modal. Reemplaza a alert() (la consigna lo prohíbe).
@Component({
  selector: 'app-modal-mensaje',
  styleUrl: './modal-mensaje.css',
  templateUrl: './modal-mensaje.html',
})
export class ModalMensaje {
  private botonAceptar = viewChild<ElementRef<HTMLButtonElement>>('botonAceptar');

  constructor(public modal: Modal) {
    // Cuando aparece el modal, el foco va al botón (se puede cerrar con Enter)
    effect(() => this.botonAceptar()?.nativeElement.focus());
  }

  // Escape también lo cierra
  @HostListener('document:keydown.escape')
  alPresionarEscape() {
    if (this.modal.datos()) {
      this.modal.cerrar();
    }
  }
}
