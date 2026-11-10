import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe propia (Sprint 4): las iniciales de una persona, para el avatar cuando no subió foto.
 *   {{ usuario | iniciales }}  ->  "EM"  (Enrico Montes)
 *
 * Antes había una función iniciales() COPIADA en 6 componentes (navbar, tarjeta, comentarios,
 * mi perfil, dashboard y registro). Ahora la lógica está en un solo lugar.
 *
 * Es "pura" (el default): Angular solo la vuelve a ejecutar si cambia el valor de entrada,
 * no en cada detección de cambios. Una función llamada desde el template se ejecuta siempre.
 */
@Pipe({ name: 'iniciales' })
export class InicialesPipe implements PipeTransform {
  transform(persona: { nombre?: string; apellido?: string } | null | undefined): string {
    if (!persona) {
      return '';
    }
    const nombre = persona.nombre?.trim() ?? '';
    const apellido = persona.apellido?.trim() ?? '';
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  }
}
