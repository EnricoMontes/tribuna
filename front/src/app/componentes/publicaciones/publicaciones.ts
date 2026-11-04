import { DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../servicios/auth';

// Sprint 1: pantalla creada y navegable. El listado paginado, el orden y los me gusta llegan en el sprint 2.
@Component({
  imports: [RouterLink, DecimalPipe],
  selector: 'app-publicaciones',
  styleUrl: './publicaciones.css',
  templateUrl: './publicaciones.html',
})
export class Publicaciones {
  // Por ahora en 0: en el sprint 2 se completa con lo que devuelve la API
  readonly tablero = [
    { nombre: 'Publicaciones', valor: 0 },
    { nombre: 'Me gusta', valor: 0 },
    { nombre: 'Comentarios', valor: 0 },
  ];

  readonly pasos = [
    { titulo: 'Hacete la cuenta', texto: 'Poné una foto y contá de qué cuadro sos.' },
    { titulo: 'Subí lo tuyo', texto: 'Lo que pensaste del partido, la foto desde la popular, lo que pinte.' },
    { titulo: 'Metete en la charla', texto: 'Dale me gusta a lo que te cierra y comentá.' },
  ];

  constructor(public auth: Auth) {}
}
