import { inject, Service } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { Modal } from './modal';

/**
 * PWA (Sprint 4): el service worker guarda la app en el navegador para que abra rápido (y se pueda
 * instalar). La contra: si se sube una versión nueva a Vercel, el usuario seguiría viendo la vieja.
 * SwUpdate avisa cuando el service worker ya descargó la nueva ("VERSION_READY"): ahí se le
 * pregunta con el modal si quiere recargar. Si no estamos en producción, SwUpdate está apagado.
 */
@Service()
export class Actualizaciones {
  private swUpdate = inject(SwUpdate);
  private modal = inject(Modal);

  escuchar() {
    if (!this.swUpdate.isEnabled) {
      return;
    }
    this.swUpdate.versionUpdates
      .pipe(filter((evento): evento is VersionReadyEvent => evento.type === 'VERSION_READY'))
      .subscribe(() =>
        this.modal.confirmar(
          'Hay una versión nueva de Tribuna',
          'Recargá para ver las últimas mejoras. Si estabas escribiendo algo, guardalo antes.',
          'Recargar',
          () => document.location.reload(),
          false, // botón azul: no es una acción peligrosa
        ),
      );

    // Si el service worker quedó en un estado que no puede arreglar (por ejemplo, borraron
    // archivos de la caché), lo único seguro es recargar la página
    this.swUpdate.unrecoverable.subscribe(() => document.location.reload());
  }
}
