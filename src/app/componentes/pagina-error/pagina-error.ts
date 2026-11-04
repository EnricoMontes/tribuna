import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Ruta '**': cualquier URL que no exista. (No se llama "Error" para no tapar la clase Error de JS.)
@Component({
  imports: [RouterLink],
  selector: 'app-pagina-error',
  template: `
    <section class="contenedor">
      <div class="panel cartel">
        <!-- banderín del juez de línea levantado: posición adelantada -->
        <svg class="banderin" viewBox="0 0 64 80" aria-hidden="true">
          <rect x="10" y="6" width="4" height="72" rx="2" fill="#031521" />
          <path d="M14 8h40v28H14Z" fill="#f5c518" />
          <path d="M14 8h10v7H14Zm20 0h10v7H34Zm-10 7h10v7H24Zm20 0h10v7H44ZM14 22h10v7H14Zm20 0h10v7H34Zm-10 7h10v7H24Zm20 0h10v7H44Z" fill="#d93030" />
        </svg>
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
    .banderin {
      display: block;
      width: 72px;
      height: 90px;
      margin: 0 auto 1rem;
      transform-origin: 18% 95%;
      animation: flamear 2.4s ease-in-out infinite;
    }
    @keyframes flamear {
      50% {
        transform: rotate(-8deg);
      }
    }
    p {
      color: var(--texto-suave);
      margin-bottom: 1.5rem;
    }
  `,
})
export class PaginaError {}
