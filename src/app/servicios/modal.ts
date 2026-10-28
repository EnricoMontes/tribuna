import { Service, signal } from '@angular/core';

export type TipoModal = 'exito' | 'error' | 'info';

export interface DatosModal {
  tipo: TipoModal;
  titulo: string;
  mensaje: string;
}

// Reemplaza a alert(): cualquier componente pide mostrar un mensaje y
// el componente <app-modal-mensaje> (que está una sola vez en app.html) lo dibuja.
@Service()
export class Modal {
  datos = signal<DatosModal | null>(null);
  private alCerrar?: () => void;

  exito(titulo: string, mensaje: string, alCerrar?: () => void) {
    this.mostrar({ tipo: 'exito', titulo, mensaje }, alCerrar);
  }

  error(titulo: string, mensaje: string) {
    this.mostrar({ tipo: 'error', titulo, mensaje });
  }

  info(titulo: string, mensaje: string, alCerrar?: () => void) {
    this.mostrar({ tipo: 'info', titulo, mensaje }, alCerrar);
  }

  cerrar() {
    const accion = this.alCerrar;
    this.alCerrar = undefined;
    this.datos.set(null);
    accion?.();
  }

  private mostrar(datos: DatosModal, alCerrar?: () => void) {
    this.alCerrar = alCerrar;
    this.datos.set(datos);
  }
}
