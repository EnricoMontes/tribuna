import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ImagenRespaldoDirective } from '../../directivas/imagen-respaldo.directive';
import { SoloAdminDirective } from '../../directivas/solo-admin.directive';
import { InicialesPipe } from '../../pipes/iniciales.pipe';
import { Auth } from '../../servicios/auth';
import { Logo } from '../logo/logo';

@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    Logo,
    InicialesPipe,
    ImagenRespaldoDirective,
    SoloAdminDirective,
  ],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  constructor(
    public auth: Auth,
    private router: Router,
  ) {}

  salir() {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
