import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ModalMensaje } from './componentes/modal-mensaje/modal-mensaje';
import { Navbar } from './componentes/navbar/navbar';

@Component({
  imports: [RouterOutlet, RouterLink, Navbar, ModalMensaje],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  // Frases de la cinta del pie
  protected readonly frases = [
    'Opiná de cada partido',
    'Subí tus fotos de cancha',
    'Reaccioná con la hinchada',
    'Bancá a tu equipo',
  ];
}
