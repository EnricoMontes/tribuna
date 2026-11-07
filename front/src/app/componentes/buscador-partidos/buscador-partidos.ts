import { DatePipe } from '@angular/common';
import { Component, computed, ElementRef, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Partido } from '../../modelos/partido';

const MAXIMO_RESULTADOS = 6;

/** Minúsculas y sin tildes: "Córdoba" -> "cordoba", así buscar "cordoba" o "CÓRDOBA" da lo mismo */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Buscador de partidos del inicio: se escribe un equipo y aparecen los partidos ya jugados
 * que coinciden; al elegir uno se entra a /partidos/:id (todas las publicaciones de ese partido).
 *
 * Filtra en el navegador la lista que la pantalla ya trajo (input partidos): no hace otra petición.
 * Cada palabra tiene que aparecer en el local, el visitante o la fecha:
 * "river" -> todos los de River · "river talleres" -> River vs Talleres · "fecha 16" -> esa fecha.
 * Teclado: flechas para moverse, Enter para entrar, Escape para cerrar.
 * El desplegable flota encima del contenido; se cierra con un click afuera y se vuelve a abrir
 * con un click (o foco) en el buscador.
 */
@Component({
  imports: [DatePipe],
  selector: 'app-buscador-partidos',
  host: {
    // Click en cualquier lado de la página: si fue afuera del buscador, se cierra el desplegable
    '(document:pointerdown)': 'clickEnLaPagina($event)',
  },
  styleUrl: './buscador-partidos.css',
  templateUrl: './buscador-partidos.html',
})
export class BuscadorPartidos {
  private router = inject(Router);
  private elemento = inject(ElementRef<HTMLElement>);

  partidos = input.required<Partido[]>();

  texto = signal('');
  activo = signal(0); // índice del resultado marcado con el teclado
  abierto = signal(false); // el desplegable se ve si está abierto y hay algo escrito

  private palabras = computed(() => normalizar(this.texto()).split(/\s+/).filter(Boolean));

  // Todas las coincidencias (para el "y N más") y las que se muestran
  coincidencias = computed(() => {
    const palabras = this.palabras();
    if (!palabras.length) return [];
    return this.partidos().filter((p) => {
      const donde = normalizar(`${p.local.nombre} ${p.visitante.nombre} ${p.fecha}`);
      return palabras.every((palabra) => donde.includes(palabra));
    });
  });
  resultados = computed(() => this.coincidencias().slice(0, MAXIMO_RESULTADOS));

  escribir(valor: string) {
    this.texto.set(valor);
    this.activo.set(0);
    this.abierto.set(true);
  }

  abrir() {
    this.abierto.set(true);
  }

  clickEnLaPagina(evento: PointerEvent) {
    if (!this.elemento.nativeElement.contains(evento.target as Node)) {
      this.abierto.set(false);
    }
  }

  teclado(evento: KeyboardEvent) {
    const cantidad = this.resultados().length;
    if (evento.key === 'ArrowDown' && cantidad) {
      evento.preventDefault();
      this.activo.update((i) => (i + 1) % cantidad);
    } else if (evento.key === 'ArrowUp' && cantidad) {
      evento.preventDefault();
      this.activo.update((i) => (i - 1 + cantidad) % cantidad);
    } else if (evento.key === 'Enter' && cantidad) {
      evento.preventDefault();
      this.entrar(this.resultados()[this.activo()]);
    } else if (evento.key === 'Escape') {
      // preventDefault: en un input type="search" el navegador borra el texto con Escape
      evento.preventDefault();
      this.abierto.set(false); // cierra el desplegable sin borrar lo escrito
    }
  }

  entrar(partido: Partido) {
    this.abierto.set(false);
    this.router.navigate(['/partidos', partido.id]);
  }
}
