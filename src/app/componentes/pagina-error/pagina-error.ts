import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Ruta '**': cualquier URL que no exista. (No se llama "Error" para no tapar la clase Error de JS.)
@Component({
  imports: [RouterLink],
  selector: 'app-pagina-error',
  template: `
    <section class="contenedor">
      <div class="panel cartel">
        <span class="tarjeta" aria-hidden="true"></span>
        <span class="etiqueta-seccion">Error 404</span>
        <h1>Fuera de juego</h1>
        <p>La página que buscás no existe o cambió de lugar.</p>
        <a class="boton" routerLink="/publicaciones">Volver a la tribuna</a>
      </div>
    </section>
  `,
  styles: `
    .cartel {
      max-width: 520px;
      margin: 0 auto;
      text-align: center;
    }
    .tarjeta {
      display: inline-block;
      width: 46px;
      height: 64px;
      border-radius: 6px;
      background: var(--azul);
      transform: rotate(-12deg);
      margin-bottom: 1rem;
      box-shadow: var(--sombra);
    }
    p {
      color: var(--texto-suave);
      margin-bottom: 1.5rem;
    }
  `,
})
export class PaginaError {}
