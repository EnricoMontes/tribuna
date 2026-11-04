import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalMensaje } from './componentes/modal-mensaje/modal-mensaje';
import { Logo } from './componentes/logo/logo';
import { Navbar } from './componentes/navbar/navbar';

@Component({
  imports: [RouterOutlet, Navbar, ModalMensaje, Logo],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  // Frases de la cinta del pie
  protected readonly frases = [
    'Opiná de cada partido',
    'Subí tus fotos de cancha',
    'Noventa minutos de aliento',
    'Reaccioná con la hinchada',
    'El fútbol se vive en la tribuna',
    'Bancá a tu equipo',
  ];
}
