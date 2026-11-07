import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { Orden, PaginaPublicaciones, Publicacion } from '../../modelos/publicacion';
import { Auth } from '../../servicios/auth';
import { Modal } from '../../servicios/modal';
import { Publicaciones } from '../../servicios/publicaciones';
import { mensajeDeError } from '../../utilidades/errores';
import { Cargando } from '../cargando/cargando';
import { TarjetaPublicacion } from '../tarjeta-publicacion/tarjeta-publicacion';

/**
 * Listado paginado de publicaciones: orden (fecha / me gusta), páginas, me gusta y eliminar.
 * Lo usan la pantalla Publicaciones (todas), la página de un partido (input partido)
 * y Mi perfil (input usuario, 3 por página y sin controles: "mis últimas 3").
 */
@Component({
  imports: [Cargando, TarjetaPublicacion],
  selector: 'app-lista-publicaciones',
  styleUrl: './lista-publicaciones.css',
  templateUrl: './lista-publicaciones.html',
})
export class ListaPublicaciones {
  private publicacionesApi = inject(Publicaciones);
  private auth = inject(Auth);
  private modal = inject(Modal);

  partido = input<string>(); // si viene, solo las de ese partido
  usuario = input<string>(); // si viene, solo las de ese usuario
  porPagina = input(5);
  conControles = input(true); // orden y paginación
  mostrarPartido = input(true);
  conComentarios = input(false); // Mi perfil: cada publicación con sus comentarios abajo
  cargada = output<PaginaPublicaciones>(); // avisa al padre cada vez que llega una página (total, etc.)

  orden = signal<Orden>('fecha'); // la consigna pide "por fecha por defecto"
  pagina = signal(1);
  cargando = signal(false);
  error = signal('');
  datos = signal<PaginaPublicaciones | null>(null);
  procesando = signal<string | null>(null); // id de la publicación con un me gusta en curso

  totalPaginas = computed(() =>
    Math.max(1, Math.ceil((this.datos()?.total ?? 0) / this.porPagina())),
  );

  constructor() {
    // effect: se vuelve a ejecutar solo cuando cambia alguno de los signals que lee
    // (orden, página, partido o usuario). untracked: lo de adentro no suma dependencias.
    effect(() => {
      this.orden();
      this.pagina();
      this.partido();
      this.usuario();
      untracked(() => this.recargar());
    });
  }

  cambiarOrden(orden: Orden) {
    this.orden.set(orden);
    this.pagina.set(1); // al cambiar el orden se vuelve a la primera página
  }

  irAPagina(pagina: number) {
    this.pagina.set(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  recargar() {
    this.cargando.set(true);
    this.error.set('');
    const limit = this.porPagina();
    this.publicacionesApi
      .listar({
        orden: this.orden(),
        partido: this.partido(),
        usuario: this.usuario(),
        limit,
        offset: (this.pagina() - 1) * limit,
      })
      .subscribe({
        next: (datos) => {
          this.datos.set(datos);
          this.cargando.set(false);
          this.cargada.emit(datos);
        },
        error: (error) => {
          this.cargando.set(false);
          this.error.set(mensajeDeError(error));
        },
      });
  }

  esMia(publicacion: Publicacion): boolean {
    const usuario = this.auth.usuario();
    return (
      !!usuario && (publicacion.autor._id === usuario._id || usuario.perfil === 'administrador')
    );
  }

  /** Llega desde la tarjeta (output meGusta): si ya le di me gusta lo saco, si no lo doy */
  alternarMeGusta(publicacion: Publicacion) {
    this.procesando.set(publicacion._id);
    const pedido = publicacion.meGustaMio
      ? this.publicacionesApi.quitarMeGusta(publicacion._id)
      : this.publicacionesApi.darMeGusta(publicacion._id);
    pedido.subscribe({
      next: (resultado) => {
        this.procesando.set(null);
        // Se actualiza solo esa publicación en la lista (sin volver a pedir la página)
        this.datos.update(
          (pagina) =>
            pagina && {
              ...pagina,
              publicaciones: pagina.publicaciones.map((p) =>
                p._id === publicacion._id ? { ...p, ...resultado } : p,
              ),
            },
        );
      },
      error: (error) => {
        this.procesando.set(null);
        this.modal.error('No se pudo actualizar el me gusta', mensajeDeError(error));
      },
    });
  }

  /** Llega desde la tarjeta (output eliminar): se pide confirmación con el modal propio */
  confirmarEliminar(publicacion: Publicacion) {
    this.modal.confirmar(
      '¿Eliminar la publicación?',
      `"${publicacion.titulo}" va a dejar de verse en la tribuna.`,
      'Sí, eliminar',
      () => this.eliminar(publicacion),
    );
  }

  private eliminar(publicacion: Publicacion) {
    this.publicacionesApi.eliminar(publicacion._id).subscribe({
      next: () => {
        this.modal.exito('Publicación eliminada', 'Ya no aparece en la tribuna.');
        // Si era la única de la última página, se vuelve a la anterior
        const quedanEnPagina = (this.datos()?.publicaciones.length ?? 1) - 1;
        if (quedanEnPagina === 0 && this.pagina() > 1) {
          this.pagina.update((p) => p - 1);
        } else {
          this.recargar();
        }
      },
      error: (error) => this.modal.error('No se pudo eliminar', mensajeDeError(error)),
    });
  }
}
