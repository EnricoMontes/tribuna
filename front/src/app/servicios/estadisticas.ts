import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// El "lapso de tiempo" que elige el admin: días AAAA-MM-DD, los dos incluidos
export interface Rango {
  desde: string;
  hasta: string;
}

// Lo que devuelven las tres rutas de GET /estadisticas/...
interface Respuesta<T> {
  desde: string;
  hasta: string;
  total: number;
  datos: T[];
}

export type PublicacionesPorUsuario = Respuesta<{
  usuario: { _id: string; nombreUsuario: string; nombre: string; apellido: string };
  cantidad: number;
}>;

export type ComentariosPorDia = Respuesta<{ fecha: string; cantidad: number }>;

export type ComentariosPorPublicacion = Respuesta<{
  publicacion: { _id: string; titulo: string; autor: string };
  cantidad: number;
}>;

/** Sprint 4: las rutas del EstadisticasController (solo administradores; el token lo pone el interceptor) */
@Service()
export class Estadisticas {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/estadisticas`;

  publicacionesPorUsuario(rango: Rango): Observable<PublicacionesPorUsuario> {
    return this.http.get<PublicacionesPorUsuario>(`${this.url}/publicaciones-por-usuario`, {
      params: this.params(rango),
    });
  }

  comentariosPorDia(rango: Rango): Observable<ComentariosPorDia> {
    return this.http.get<ComentariosPorDia>(`${this.url}/comentarios-por-dia`, {
      params: this.params(rango),
    });
  }

  comentariosPorPublicacion(rango: Rango): Observable<ComentariosPorPublicacion> {
    return this.http.get<ComentariosPorPublicacion>(`${this.url}/comentarios-por-publicacion`, {
      params: this.params(rango),
    });
  }

  private params({ desde, hasta }: Rango) {
    return new HttpParams().set('desde', desde).set('hasta', hasta);
  }
}
