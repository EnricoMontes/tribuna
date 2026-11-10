import { Component, inject } from '@angular/core';
import { map } from 'rxjs';
import { Estadisticas, Rango } from '../../servicios/estadisticas';
import { GraficoEstadistica } from '../grafico-estadistica/grafico-estadistica';

const LARGO_TITULO = 28;

/**
 * Sprint 4 — dashboard/estadisticas (solo administradores). Tres gráficos, de tipos distintos
 * como pide la consigna, cada uno con su lapso de tiempo:
 * 1. publicaciones por usuario -> torta (doughnut): qué parte del total hizo cada uno;
 * 2. comentarios realizados por día -> líneas: cómo varía en el tiempo;
 * 3. comentarios por publicación -> barras horizontales: comparar cantidades (y los títulos entran).
 * Acá solo se decide QUÉ pedir y cómo convertir la respuesta en etiquetas + valores;
 * el dibujo y el lapso los maneja cada <app-grafico-estadistica>.
 */
@Component({
  imports: [GraficoEstadistica],
  selector: 'app-dashboard-estadisticas',
  styleUrl: './dashboard-estadisticas.css',
  templateUrl: './dashboard-estadisticas.html',
})
export class DashboardEstadisticas {
  private estadisticas = inject(Estadisticas);

  // Funciones flecha: así conservan el "this" cuando el hijo las llama
  publicacionesPorUsuario = (rango: Rango) =>
    this.estadisticas.publicacionesPorUsuario(rango).pipe(
      map((r) => ({
        etiquetas: r.datos.map((d) => `@${d.usuario.nombreUsuario}`),
        valores: r.datos.map((d) => d.cantidad),
        detalles: r.datos.map((d) => `${d.usuario.nombre} ${d.usuario.apellido}`),
        total: r.total,
      })),
    );

  comentariosPorDia = (rango: Rango) =>
    this.estadisticas.comentariosPorDia(rango).pipe(
      map((r) => ({
        // "2026-11-07" -> "7/11"
        etiquetas: r.datos.map((d) => {
          const [, mes, dia] = d.fecha.split('-');
          return `${Number(dia)}/${Number(mes)}`;
        }),
        valores: r.datos.map((d) => d.cantidad),
        total: r.total,
      })),
    );

  comentariosPorPublicacion = (rango: Rango) =>
    this.estadisticas.comentariosPorPublicacion(rango).pipe(
      map((r) => ({
        // Los títulos largos se recortan en el eje; completos van en el tooltip
        etiquetas: r.datos.map((d) =>
          d.publicacion.titulo.length > LARGO_TITULO
            ? `${d.publicacion.titulo.slice(0, LARGO_TITULO - 1)}…`
            : d.publicacion.titulo,
        ),
        valores: r.datos.map((d) => d.cantidad),
        detalles: r.datos.map((d) => `"${d.publicacion.titulo}" de @${d.publicacion.autor}`),
        total: r.total,
      })),
    );
}
