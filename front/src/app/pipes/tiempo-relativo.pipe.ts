import { formatDate } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

const MINUTO = 60 * 1000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;
const ZONA = '-0300'; // hora argentina, igual que el resto de las fechas de la app

/**
 * Pipe propia (Sprint 4): cuánto hace que pasó algo, como en cualquier red social.
 *   {{ publicacion.createdAt | tiempoRelativo }}
 *   -> "recién", "hace 5 min", "hace 3 h", "ayer", "hace 4 días" y, si es más viejo, "7 nov"
 *      (con el año si no es el actual: "7 nov 2025").
 *
 * Usa formatDate de Angular (lo mismo que hay adentro del pipe date) con el idioma de la app
 * (LOCALE_ID = es-AR), que se pide con inject() porque un pipe también puede inyectar servicios.
 * Como es pura, el texto se calcula al dibujar: "hace 5 min" no cambia solo si dejás la pantalla
 * quieta, se actualiza al volver a cargar la lista.
 */
@Pipe({ name: 'tiempoRelativo' })
export class TiempoRelativoPipe implements PipeTransform {
  private idioma = inject(LOCALE_ID);

  transform(valor: string | Date | null | undefined): string {
    if (!valor) {
      return '';
    }
    const fecha = new Date(valor);
    const ahora = Date.now();
    const pasado = ahora - fecha.getTime();

    if (pasado < MINUTO) return 'recién';
    if (pasado < HORA) return `hace ${Math.floor(pasado / MINUTO)} min`;

    // "ayer" se mide en días del calendario (hora argentina), no en 24 horas exactas
    const dia = (t: number) => formatDate(t, 'yyyy-MM-dd', this.idioma, ZONA);
    const hoy = dia(ahora);
    if (dia(fecha.getTime()) === hoy && pasado < DIA) return `hace ${Math.floor(pasado / HORA)} h`;
    if (dia(fecha.getTime()) === dia(ahora - DIA)) return 'ayer';
    if (pasado < 7 * DIA) return `hace ${Math.max(2, Math.round(pasado / DIA))} días`;

    const mismoAnio = hoy.slice(0, 4) === dia(fecha.getTime()).slice(0, 4);
    return formatDate(fecha, mismoAnio ? 'd MMM' : 'd MMM y', this.idioma, ZONA);
  }
}
