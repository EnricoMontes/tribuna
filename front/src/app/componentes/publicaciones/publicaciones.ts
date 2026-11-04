import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Auth } from '../../servicios/auth';
import { Partidos } from '../../servicios/partidos';
import { ListaPublicaciones } from '../lista-publicaciones/lista-publicaciones';

@Component({
  imports: [RouterLink, DecimalPipe, DatePipe, ListaPublicaciones],
  selector: 'app-publicaciones',
  styleUrl: './publicaciones.css',
  templateUrl: './publicaciones.html',
})
export class Publicaciones {
  auth = inject(Auth);

  // Partidos de la fecha (lateral). Si falla, la lista de publicaciones se ve igual.
  partidos = toSignal(
    inject(Partidos)
      .listar()
      .pipe(catchError(() => of([]))),
    {
      initialValue: [],
    },
  );

  // El total lo informa la lista (output "cargada") cada vez que trae una página
  total = signal(0);
}
