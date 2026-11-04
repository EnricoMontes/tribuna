import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Marca de Tribuna: el escudo + el nombre y el lema.
 * Se usa en la barra de navegación y en el pie, así el logo está definido en un solo lugar.
 * input(): signal de entrada (lo que en el TP1 era @Input), con un valor por defecto.
 */
@Component({
  imports: [RouterLink],
  selector: 'app-logo',
  styleUrl: './logo.css',
  template: `
    <a class="marca" routerLink="/publicaciones" aria-label="Tribuna, ir a publicaciones">
      <img src="escudo.svg" alt="" [width]="tamano()" [height]="tamano() * 1.125">
      <span class="textos">
        <span class="nombre">Tribuna</span>
        <span class="lema">Red social futbolera</span>
      </span>
    </a>
  `,
})
export class Logo {
  tamano = input(40);
}
