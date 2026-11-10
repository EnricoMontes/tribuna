import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ImagenRespaldoDirective } from '../../directivas/imagen-respaldo.directive';
import { SoloAdminDirective } from '../../directivas/solo-admin.directive';
import { Auth } from '../../servicios/auth';
import { Partidos } from '../../servicios/partidos';
import { BuscadorPartidos } from '../buscador-partidos/buscador-partidos';
import { ListaPublicaciones } from '../lista-publicaciones/lista-publicaciones';

@Component({
  imports: [
    RouterLink,
    DecimalPipe,
    DatePipe,
    ListaPublicaciones,
    BuscadorPartidos,
    ImagenRespaldoDirective,
    SoloAdminDirective,
  ],
  selector: 'app-publicaciones',
  styleUrl: './publicaciones.css',
  templateUrl: './publicaciones.html',
})
export class Publicaciones {
  auth = inject(Auth);

  // Partidos ya jugados (lateral). Si falla, la lista de publicaciones se ve igual.
  partidos = toSignal(
    inject(Partidos)
      .listar()
      .pipe(catchError(() => of([]))),
    {
      initialValue: [],
    },
  );

  // En el lateral, solo los 10 más recientes (la API ya los manda del más nuevo al más viejo)
  ultimos = computed(() => this.partidos().slice(0, 10));

  // El total lo informa la lista (output "cargada") cada vez que trae una página
  total = signal(0);
}
