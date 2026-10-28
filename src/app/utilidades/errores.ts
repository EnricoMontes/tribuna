import { HttpErrorResponse } from '@angular/common/http';

// Convierte el error de la API de Nest ({ statusCode, message, error }) en un texto para el usuario.
export function mensajeDeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.';
    }
    if (error.status === 413) {
      return 'La imagen es demasiado pesada (máximo 2 MB).';
    }
    const mensaje: unknown = error.error?.message;
    if (Array.isArray(mensaje)) {
      return mensaje.join('\n'); // ValidationPipe devuelve un array con un mensaje por campo
    }
    if (typeof mensaje === 'string') {
      return mensaje;
    }
  }
  return 'Ocurrió un error inesperado. Intentá de nuevo en unos minutos.';
}
