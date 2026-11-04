import { Service, signal } from '@angular/core';

export type TipoModal = 'exito' | 'error' | 'info' | 'confirmar';

export interface DatosModal {
  tipo: TipoModal;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string; // solo en 'confirmar': texto del botón principal
}

// Reemplaza a alert() y confirm(): cualquier componente pide mostrar un mensaje y
// el componente <app-modal-mensaje> (que está una sola vez en app.html) lo dibuja.
@Service()
export class Modal {
  datos = signal<DatosModal | null>(null);
  private alCerrar?: () => void;
  private alConfirmar?: () => void;

  exito(titulo: string, mensaje: string, alCerrar?: () => void) {
    this.mostrar({ tipo: 'exito', titulo, mensaje }, alCerrar);
  }

  error(titulo: string, mensaje: string) {
    this.mostrar({ tipo: 'error', titulo, mensaje });
  }

  info(titulo: string, mensaje: string, alCerrar?: () => void) {
    this.mostrar({ tipo: 'info', titulo, mensaje }, alCerrar);
  }

  /** Reemplazo de confirm(): dos botones. alConfirmar se ejecuta solo si el usuario acepta. */
  confirmar(titulo: string, mensaje: string, textoConfirmar: string, alConfirmar: () => void) {
    this.mostrar({ tipo: 'confirmar', titulo, mensaje, textoConfirmar });
    this.alConfirmar = alConfirmar;
  }

  /** Aceptar / Cancelar / Escape / click afuera: cierra sin confirmar */
  cerrar() {
    const accion = this.alCerrar;
    this.alCerrar = undefined;
    this.alConfirmar = undefined;
    this.datos.set(null);
    accion?.();
  }

  /** El botón principal del modal de confirmación */
  aceptarConfirmacion() {
    const accion = this.alConfirmar;
    this.cerrar();
    accion?.();
  }

  private mostrar(datos: DatosModal, alCerrar?: () => void) {
    this.alCerrar = alCerrar;
    this.alConfirmar = undefined;
    this.datos.set(datos);
  }
}
