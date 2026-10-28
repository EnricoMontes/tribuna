import { Component, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../servicios/auth';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  // Iniciales para el avatar cuando el usuario no subió foto
  iniciales = computed(() => {
    const usuario = this.auth.usuario();
    return usuario ? `${usuario.nombre[0]}${usuario.apellido[0]}`.toUpperCase() : '';
  });

  constructor(
    public auth: Auth,
    private router: Router,
  ) {}

  salir() {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
