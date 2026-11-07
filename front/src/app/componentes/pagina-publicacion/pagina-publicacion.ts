import { Location } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Publicacion } from '../../modelos/publicacion';
import { Auth } from '../../servicios/auth';
import { Modal } from '../../servicios/modal';
import { Publicaciones } from '../../servicios/publicaciones';
import { mensajeDeError } from '../../utilidades/errores';
import { Cargando } from '../cargando/cargando';
import { TarjetaPublicacion } from '../tarjeta-publicacion/tarjeta-publicacion';

/**
 * Página de una publicación: /publicaciones/:id
 * La muestra grande en la pantalla, con sus comentarios abajo (escribir, editar, "cargar más").
 * Reusa la misma tarjeta del listado, con [grande] y [conComentarios].
 */
@Component({
  imports: [RouterLink, Cargando, TarjetaPublicacion],
  selector: 'app-pagina-publicacion',
  styleUrl: './pagina-publicacion.css',
  templateUrl: './pagina-publicacion.html',
})
export class PaginaPublicacion {
  private api = inject(Publicaciones);
  private auth = inject(Auth);
  private modal = inject(Modal);
  private router = inject(Router);
  private location = inject(Location);

  id = input.required<string>(); // el :id de la ruta (withComponentInputBinding)

  publicacion = signal<Publicacion | null>(null);
  error = signal('');
  procesando = signal(false);

  puedeEliminar = computed(() => {
    const usuario = this.auth.usuario();
    const p = this.publicacion();
    return !!usuario && !!p && (p.autor._id === usuario._id || usuario.perfil === 'administrador');
  });

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.cargar(id));
    });
  }

  cargar(id: string) {
    this.publicacion.set(null);
    this.error.set('');
    this.api.obtener(id).subscribe({
      next: (p) => this.publicacion.set(p),
      error: (error) => this.error.set(mensajeDeError(error)),
    });
  }

  /** Volver a donde estaba (la lista, el partido o Mi perfil); si entró directo, a publicaciones */
  volver() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/publicaciones']);
    }
  }

  alternarMeGusta(publicacion: Publicacion) {
    this.procesando.set(true);
    const pedido = publicacion.meGustaMio
      ? this.api.quitarMeGusta(publicacion._id)
      : this.api.darMeGusta(publicacion._id);
    pedido.subscribe({
      next: (resultado) => {
        this.procesando.set(false);
        this.publicacion.update((p) => p && { ...p, ...resultado });
      },
      error: (error) => {
        this.procesando.set(false);
        this.modal.error('No se pudo actualizar el me gusta', mensajeDeError(error));
      },
    });
  }

  confirmarEliminar(publicacion: Publicacion) {
    this.modal.confirmar(
      '¿Eliminar la publicación?',
      `"${publicacion.titulo}" va a dejar de verse en la tribuna, junto con sus comentarios.`,
      'Sí, eliminar',
      () =>
        this.api.eliminar(publicacion._id).subscribe({
          next: () =>
            this.modal.exito('Publicación eliminada', 'Ya no aparece en la tribuna.', () =>
              this.router.navigate(['/publicaciones']),
            ),
          error: (error) => this.modal.error('No se pudo eliminar', mensajeDeError(error)),
        }),
    );
  }
}
