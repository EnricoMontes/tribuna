import { DatePipe, Location } from '@angular/common';
import { Component, computed, effect, inject, input, linkedSignal, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ImagenRespaldoDirective } from '../../directivas/imagen-respaldo.directive';
import { Publicacion } from '../../modelos/publicacion';
import { InicialesPipe } from '../../pipes/iniciales.pipe';
import { PluralPipe } from '../../pipes/plural.pipe';
import { TiempoRelativoPipe } from '../../pipes/tiempo-relativo.pipe';
import { Auth } from '../../servicios/auth';
import { Modal } from '../../servicios/modal';
import { Publicaciones } from '../../servicios/publicaciones';
import { mensajeDeError } from '../../utilidades/errores';
import { Cargando } from '../cargando/cargando';
import { Comentarios } from '../comentarios/comentarios';

/**
 * Página de una publicación: /publicaciones/:id, armada como en Instagram.
 * - Izquierda: la foto entera (o el partido en grande si no tiene foto).
 * - Derecha: el autor (lleva a su perfil), el título y el texto, los comentarios (lo único que se
 *   desplaza) y abajo, fijos, los me gusta, la cantidad de comentarios y el formulario.
 * Todo entra en el alto de la pantalla. En celular se apila y se lee de corrido.
 * Los comentarios son el mismo componente de Mi perfil, con [enPanel]="true"; las acciones y el
 * texto se le pasan por contenido proyectado (ng-content con select).
 */
@Component({
  imports: [
    RouterLink,
    DatePipe,
    Cargando,
    Comentarios,
    InicialesPipe,
    PluralPipe,
    TiempoRelativoPipe,
    ImagenRespaldoDirective,
  ],
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

  // Arranca con lo que trajo la API y se actualiza cuando alguien comenta (output totalCambio)
  cantidadComentarios = linkedSignal(() => this.publicacion()?.cantidadComentarios ?? 0);

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

  /** Volver a donde estaba (la lista, el partido o un perfil); si entró directo, a publicaciones */
  volver() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/publicaciones']);
    }
  }

  /** El botón "N comentarios" lleva el cursor al formulario (el textarea tiene id "nuevo-<id>") */
  enfocarComentario(id: string) {
    document.getElementById(`nuevo-${id}`)?.focus();
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
