import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalMensaje } from './componentes/modal-mensaje/modal-mensaje';
import { Navbar } from './componentes/navbar/navbar';

@Component({
  imports: [RouterOutlet, Navbar, ModalMensaje],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
