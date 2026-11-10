import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * Sprint 4: el "cascarón" del panel de administración. Tiene la cabecera y las pestañas, y
 * adentro un <router-outlet> donde se cargan las rutas hijas (dashboard/usuarios y, después,
 * dashboard/estadisticas). El adminGuard está en la ruta padre, así protege a todas las hijas.
 */
@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {}
