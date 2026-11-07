import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Cargando } from './componentes/cargando/cargando';
import { ModalMensaje } from './componentes/modal-mensaje/modal-mensaje';
import { Logo } from './componentes/logo/logo';
import { Navbar } from './componentes/navbar/navbar';
import { Auth } from './servicios/auth';

@Component({
  imports: [RouterOutlet, Navbar, ModalMensaje, Logo, Cargando],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(Auth);

  constructor() {
    // Al iniciar la aplicación se valida el token (POST /auth/autorizar). Mientras tanto, app.html
    // muestra la pantalla de carga. Si el token no sirve, el guard de la ruta manda al login.
    this.auth.verificarSesion().subscribe();
  }

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
