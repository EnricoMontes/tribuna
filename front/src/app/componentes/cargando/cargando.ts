import { Component, input } from '@angular/core';

// Contador para que cada spinner tenga ids propios en su SVG (clipPath y gradiente).
// Si hubiera dos spinners con el mismo id en la página, el segundo usaría el recorte del primero.
let siguienteId = 0;

/**
 * Spinner de carga hecho con el escudo de Tribuna.
 * El SVG va escrito acá adentro (y no como <img src="escudo.svg">) porque para animar
 * cada parte por separado con CSS (la pelota, el borde) el CSS tiene que poder "ver" esas partes.
 *
 * Animaciones (todas con CSS, en cargando.css):
 *  - la pelota gira sobre su propio centro
 *  - una luz recorre el borde del escudo
 *  - el escudo entero "late" suave
 *
 * Uso:
 *   <app-cargando />                                       spinner chico en línea
 *   <app-cargando texto="Cargando publicaciones..." />     con texto abajo
 *   <app-cargando pantallaCompleta texto="Verificando tu sesión..." />   pantalla de carga
 */
@Component({
  selector: 'app-cargando',
  styleUrl: './cargando.css',
  host: {
    role: 'status', // los lectores de pantalla anuncian que algo se está cargando
    'aria-live': 'polite',
    '[class.pantalla-completa]': 'pantallaCompleta()',
  },
  template: `
    <svg
      class="escudo"
      viewBox="0 0 64 72"
      [attr.width]="tamano()"
      [attr.height]="tamano() * 1.125"
      aria-hidden="true"
    >
      <defs>
        <linearGradient [attr.id]="id + '-borde'" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3a78f2" />
          <stop offset="1" stop-color="#1747ad" />
        </linearGradient>
        <clipPath [attr.id]="id + '-interior'">
          <path d="M32 8.5 54 14.6V34c0 14.2-9.7 23.6-22 29.4C19.7 57.6 10 48.2 10 34V14.6Z" />
        </clipPath>
      </defs>

      <!-- escudo: borde azul, filete blanco e interior azul noche con bastones -->
      <path
        d="M32 2 60 10v24c0 18.2-12.6 30.2-28 36C16.6 64.2 4 52.2 4 34V10Z"
        [attr.fill]="'url(#' + id + '-borde)'"
      />
      <path d="M32 6 57 13.1V34c0 16-11 26.8-25 32.2C18 60.8 7 50 7 34V13.1Z" fill="#fff" />
      <path
        d="M32 8.5 54 14.6V34c0 14.2-9.7 23.6-22 29.4C19.7 57.6 10 48.2 10 34V14.6Z"
        fill="#031521"
      />
      <g [attr.clip-path]="'url(#' + id + '-interior)'" fill="#1f5bd8" opacity=".55">
        <rect x="14" y="0" width="6" height="72" />
        <rect x="29" y="0" width="6" height="72" />
        <rect x="44" y="0" width="6" height="72" />
      </g>

      <!-- franja superior con la estrella -->
      <path d="M10 14.6 32 8.5l22 6.1V25H10Z" fill="#031521" />
      <path d="M10 25h44" stroke="#fff" stroke-width="1.6" />
      <polygon
        class="estrella"
        points="32,11.2 33.4,15 37.4,15.1 34.2,17.5 35.4,21.4 32,19.1 28.6,21.4 29.8,17.5 26.6,15.1 30.6,15"
        fill="#fff"
      />

      <!-- luz que recorre el borde: pathLength="100" hace que el largo del trazo se mida en % -->
      <path
        class="luz"
        d="M32 2 60 10v24c0 18.2-12.6 30.2-28 36C16.6 64.2 4 52.2 4 34V10Z"
        pathLength="100"
      />

      <!-- pelota (es la parte que gira) -->
      <g class="pelota">
        <circle cx="32" cy="40.5" r="11.5" fill="#fff" stroke="#031521" stroke-width="1.4" />
        <polygon points="32,35.6 36.7,39 34.9,44.5 29.1,44.5 27.3,39" fill="#031521" />
        <g stroke="#031521" stroke-width="1.4" stroke-linecap="round">
          <path
            d="M32 35.6V29.4M36.7 39l5.8-1.9M34.9 44.5l3.6 5M29.1 44.5l-3.6 5M27.3 39l-5.8-1.9"
          />
        </g>
      </g>
    </svg>

    @if (texto()) {
      <p class="texto">{{ texto() }}</p>
    }
  `,
})
export class Cargando {
  tamano = input(64); // ancho en px (el alto sale de la proporción 8:9 del escudo)
  texto = input('');
  pantallaCompleta = input(false, {
    // permite escribir solo <app-cargando pantallaCompleta /> (sin ="true")
    transform: (valor: boolean | string) => valor !== false && valor !== 'false',
  });

  protected readonly id = `cargando-${siguienteId++}`;
}
