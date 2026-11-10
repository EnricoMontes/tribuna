import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ImagenRespaldoDirective } from '../../directivas/imagen-respaldo.directive';
import { Partido as DatosPartido } from '../../modelos/partido';
import { PaginaPublicaciones } from '../../modelos/publicacion';
import { Partidos } from '../../servicios/partidos';
import { ListaPublicaciones } from '../lista-publicaciones/lista-publicaciones';

/**
 * Página de un partido: /partidos/:id -> todas las publicaciones de ese partido.
 * El :id llega como input gracias a withComponentInputBinding() (ver app.config.ts).
 */
@Component({
  imports: [DatePipe, RouterLink, ListaPublicaciones, ImagenRespaldoDirective],
  selector: 'app-partido',
  styleUrl: './partido.css',
  templateUrl: './partido.html',
})
export class Partido {
  id = input.required<string>();

  private partidosDeLaFecha = toSignal(
    inject(Partidos)
      .listar()
      .pipe(catchError(() => of<DatosPartido[]>([]))),
  );
  // Si el partido no está en la lista (por ejemplo, de un torneo anterior), los datos se toman
  // de la copia que tiene la primera publicación
  private delaPublicacion = signal<DatosPartido | null>(null);

  partido = computed(
    () => this.partidosDeLaFecha()?.find((p) => p.id === this.id()) ?? this.delaPublicacion(),
  );
  // Ya respondió /partidos y no apareció en ningún lado (ni en la fecha ni en publicaciones)
  noEncontrado = signal(false);

  alCargar(pagina: PaginaPublicaciones) {
    const primera = pagina.publicaciones[0];
    if (primera) {
      this.delaPublicacion.set(primera.partido);
    }
    this.noEncontrado.set(
      !this.partido() && pagina.total === 0 && this.partidosDeLaFecha() !== undefined,
    );
  }
}
