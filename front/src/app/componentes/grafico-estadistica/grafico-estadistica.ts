import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  input,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Observable } from 'rxjs';
import { Rango } from '../../servicios/estadisticas';
import { mensajeDeError } from '../../utilidades/errores';

// Chart.js viene "en piezas" (tipos de gráfico, escalas, tooltips...): registerables las registra todas
Chart.register(...registerables);
Chart.defaults.font.family = "'Manrope', system-ui, sans-serif";
Chart.defaults.color = '#5e6873';

export type TipoGrafico = 'doughnut' | 'line' | 'bar';

/** Lo que el padre le pasa ya armado para dibujar: una etiqueta y un valor por barra/porción/punto */
export interface DatosGrafico {
  etiquetas: string[];
  valores: number[];
  detalles?: string[]; // texto extra para el tooltip (por ejemplo, el autor de la publicación)
  total: number;
}

// Colores del club (azul) y complementarios, para las porciones de la torta
const PALETA = [
  '#1f5bd8',
  '#031521',
  '#5b8def',
  '#1e9e5a',
  '#f2a900',
  '#d33a3a',
  '#7a5af8',
  '#0ea5b7',
  '#8a939c',
  '#b8c9f5',
];
const DIA_MS = 24 * 60 * 60 * 1000;

/** Un día AAAA-MM-DD en hora argentina (UTC-3), corrido "dias" para atrás */
function diaArgentino(diasAtras = 0): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000 - diasAtras * DIA_MS).toISOString().slice(0, 10);
}

/**
 * Sprint 4: UN gráfico de estadísticas, reusable. Cada uno tiene SU lapso de tiempo
 * (la consigna lo pide para cada estadística), su estado de carga y su <canvas> de Chart.js.
 * El padre decide qué pedir (input "pedir": una función que recibe el rango y devuelve los datos)
 * y qué tipo de gráfico es (torta, líneas o barras).
 */
@Component({
  selector: 'app-grafico-estadistica',
  styleUrl: './grafico-estadistica.css',
  templateUrl: './grafico-estadistica.html',
})
export class GraficoEstadistica implements OnDestroy {
  titulo = input.required<string>();
  descripcion = input('');
  tipo = input.required<TipoGrafico>();
  unidad = input('elementos'); // "publicaciones", "comentarios": para el texto del total
  pedir = input.required<(rango: Rango) => Observable<DatosGrafico>>();

  // viewChild: la referencia al <canvas #lienzo> del template, donde dibuja Chart.js
  private lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private grafico?: Chart;

  readonly hoy = diaArgentino();
  desde = signal(diaArgentino(29)); // por defecto: los últimos 30 días
  hasta = signal(this.hoy);

  datos = signal<DatosGrafico | null>(null);
  cargando = signal(true);
  error = signal('');

  readonly atajos = [
    { texto: '7 días', dias: 7 },
    { texto: '30 días', dias: 30 },
    { texto: '90 días', dias: 90 },
  ];

  // Las barras horizontales crecen con la cantidad de publicaciones (34px cada una)
  alto = computed(() =>
    this.tipo() === 'bar' ? Math.max(280, (this.datos()?.etiquetas.length ?? 0) * 34 + 40) : 300,
  );

  constructor() {
    // afterNextRender: recién cuando el <canvas> ya está en la pantalla se puede dibujar
    afterNextRender(() => this.cargar());
  }

  cambiarDesde(evento: Event) {
    this.desde.set((evento.target as HTMLInputElement).value);
    this.cargar();
  }

  cambiarHasta(evento: Event) {
    this.hasta.set((evento.target as HTMLInputElement).value);
    this.cargar();
  }

  /** Atajo: los últimos N días hasta hoy */
  ultimos(dias: number) {
    this.desde.set(diaArgentino(dias - 1));
    this.hasta.set(this.hoy);
    this.cargar();
  }

  esAtajo(dias: number): boolean {
    return this.hasta() === this.hoy && this.desde() === diaArgentino(dias - 1);
  }

  cargar() {
    // Primero se valida acá para avisar al toque (el back igual vuelve a validar y responde 400)
    if (!this.desde() || !this.hasta()) {
      this.error.set('Elegí las dos fechas.');
      return;
    }
    if (this.desde() > this.hasta()) {
      this.error.set('La fecha "desde" no puede ser posterior a "hasta".');
      return;
    }
    this.error.set('');
    this.cargando.set(true);
    this.pedir()({ desde: this.desde(), hasta: this.hasta() }).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
        this.dibujar(datos);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  ngOnDestroy() {
    // Chart.js deja listeners (resize, mouse): se libera al salir de la pantalla
    this.grafico?.destroy();
  }

  /** La primera vez crea el gráfico; después solo le cambia los datos y lo actualiza (con animación) */
  private dibujar(datos: DatosGrafico) {
    if (this.grafico) {
      this.grafico.data.labels = datos.etiquetas;
      this.grafico.data.datasets[0].data = datos.valores;
      this.grafico.data.datasets[0].backgroundColor = this.colores(datos.valores.length);
      this.grafico.update();
      return;
    }
    this.grafico = new Chart(this.lienzo().nativeElement, this.configuracion(datos));
  }

  private colores(cantidad: number): string | string[] {
    if (this.tipo() === 'doughnut') {
      return Array.from({ length: cantidad }, (_, i) => PALETA[i % PALETA.length]);
    }
    return this.tipo() === 'line' ? 'rgba(31, 91, 216, 0.12)' : '#1f5bd8';
  }

  private configuracion(datos: DatosGrafico): ChartConfiguration {
    const tipo = this.tipo();
    const detalles = () => this.datos()?.detalles;
    return {
      type: tipo,
      data: {
        labels: datos.etiquetas,
        datasets: [
          {
            label: this.unidad(),
            data: datos.valores,
            backgroundColor: this.colores(datos.valores.length),
            borderColor: tipo === 'doughnut' ? '#ffffff' : '#1f5bd8',
            borderWidth: tipo === 'line' ? 3 : 2,
            ...(tipo === 'line' && {
              fill: true,
              tension: 0.3,
              pointRadius: 3,
              pointBackgroundColor: '#1f5bd8',
            }),
            ...(tipo === 'bar' && { borderRadius: 6, borderWidth: 0, maxBarThickness: 24 }),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // el alto lo da el contenedor (ver "alto")
        indexAxis: tipo === 'bar' ? 'y' : 'x', // barras horizontales: los títulos largos entran mejor
        plugins: {
          legend: { display: tipo === 'doughnut', position: 'right' },
          tooltip: {
            callbacks: {
              // Debajo del valor, el detalle (por ejemplo "de @tano_gomez")
              afterLabel: (item) => detalles()?.[item.dataIndex] ?? '',
            },
          },
        },
        ...(tipo === 'doughnut'
          ? { cutout: '55%' }
          : {
              scales: {
                // Son cantidades: sin decimales en el eje
                [tipo === 'bar' ? 'x' : 'y']: { beginAtZero: true, ticks: { precision: 0 } },
                [tipo === 'bar' ? 'y' : 'x']: { grid: { display: false } },
              },
            }),
      },
    } as ChartConfiguration;
  }
}
