import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../servicios/auth';

// Sprint 1: pantalla creada y navegable. El listado paginado, el orden y los me gusta llegan en el sprint 2.
@Component({
  imports: [RouterLink],
  selector: 'app-publicaciones',
  styleUrl: './publicaciones.css',
  templateUrl: './publicaciones.html',
})
export class Publicaciones {
  constructor(public auth: Auth) {}
}
