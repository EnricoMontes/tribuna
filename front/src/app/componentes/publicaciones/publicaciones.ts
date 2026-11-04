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
    { titulo: 'Armá tu camiseta', texto: 'Creá tu cuenta con foto y contá de qué cuadro sos.' },
    { titulo: 'Salí a la cancha', texto: 'Publicá tu opinión del partido con una foto.' },
    { titulo: 'Hacé ruido', texto: 'Dale me gusta y comentá lo que dice la hinchada.' },
  ];

  readonly reglamento = [
    { tarjeta: 'verde', texto: 'Fair play: se discute el partido, no a las personas.' },
    { tarjeta: 'amarilla', texto: 'Subí fotos propias o con permiso de quien sale.' },
    { tarjeta: 'roja', texto: 'Insultos o discriminación: expulsión directa.' },
  ];

  constructor(public auth: Auth) {}
}
