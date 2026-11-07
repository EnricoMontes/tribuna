import { Routes } from '@angular/router';
import { sesionGuard } from './guards/sesion.guard';

// Todas las pantallas con lazy loading (loadComponent): cada una se descarga recién al visitarla.
// Sprint 2: las pantallas de la red social piden sesión (sesionGuard); login y registro son libres.
// Sprint 3: al abrir la app, el guard espera a que POST /auth/autorizar valide el token
// (mientras tanto se ve la pantalla de carga). Válido -> publicaciones; si no -> login.
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
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./componentes/publicaciones/publicaciones').then((m) => m.Publicaciones),
  },
  {
    // Una publicación grande, con sus comentarios
    path: 'publicaciones/:id',
    title: 'Publicación · Tribuna',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./componentes/pagina-publicacion/pagina-publicacion').then(
        (m) => m.PaginaPublicacion,
      ),
  },
  {
    // :id -> llega al componente como input (withComponentInputBinding en app.config.ts)
    path: 'partidos/:id',
    title: 'Partido · Tribuna',
    canActivate: [sesionGuard],
    loadComponent: () => import('./componentes/partido/partido').then((m) => m.Partido),
  },
  {
    path: 'publicar',
    title: 'Publicar · Tribuna',
    canActivate: [sesionGuard],
    loadComponent: () => import('./componentes/publicar/publicar').then((m) => m.Publicar),
  },
  {
    path: 'mi-perfil',
    title: 'Mi perfil · Tribuna',
    canActivate: [sesionGuard],
    loadComponent: () => import('./componentes/mi-perfil/mi-perfil').then((m) => m.MiPerfil),
  },
  {
    path: '**',
    title: 'Fuera de juego · Tribuna',
    loadComponent: () =>
      import('./componentes/pagina-error/pagina-error').then((m) => m.PaginaError),
  },
];
