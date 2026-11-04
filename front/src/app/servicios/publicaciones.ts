import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FiltrosPublicaciones, PaginaPublicaciones, Publicacion } from '../modelos/publicacion';

// El token no se manda acá: lo agrega el tokenInterceptor a cada petición
@Service()
export class Publicaciones {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/publicaciones`;

  /** GET /publicaciones?orden=&offset=&limit=&usuario=&partido= */
  listar(filtros: FiltrosPublicaciones): Observable<PaginaPublicaciones> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return this.http.get<PaginaPublicaciones>(this.url, { params });
  }

  /** FormData: titulo, mensaje, partidoId y la imagen (opcional) */
  crear(datos: FormData): Observable<Publicacion> {
    return this.http.post<Publicacion>(this.url, datos);
  }

  eliminar(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.url}/${id}`);
  }

  darMeGusta(id: string) {
    return this.http.post<{ cantidadMeGusta: number; meGustaMio: boolean }>(
      `${this.url}/${id}/me-gusta`,
      {},
    );
  }

  quitarMeGusta(id: string) {
    return this.http.delete<{ cantidadMeGusta: number; meGustaMio: boolean }>(
      `${this.url}/${id}/me-gusta`,
    );
  }
}
