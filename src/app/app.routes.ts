import { Routes } from '@angular/router';

// Todas las pantallas con lazy loading (loadComponent): cada una se descarga recién al visitarla.
// Sprint 1: navegación libre, sin guards ("sin límites de accesibilidad").
export const routes: Routes = [
  { path: '', redirectTo: 'publicaciones', pathMatch: 'full' },
  {
    path: 'login',
    title: 'Ingresar · Tribuna',
    loadComponent: () => import('./componentes/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    title: 'Crear cuenta · Tribuna',
    loadComponent: () => import('./componentes/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'publicaciones',
    title: 'Publicaciones · Tribuna',
    loadComponent: () =>
      import('./componentes/publicaciones/publicaciones').then((m) => m.Publicaciones),
  },
  {
    path: 'mi-perfil',
    title: 'Mi perfil · Tribuna',
    loadComponent: () => import('./componentes/mi-perfil/mi-perfil').then((m) => m.MiPerfil),
  },
  {
    path: '**',
    title: 'Fuera de juego · Tribuna',
    loadComponent: () =>
      import('./componentes/pagina-error/pagina-error').then((m) => m.PaginaError),
  },
];
