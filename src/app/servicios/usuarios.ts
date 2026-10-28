import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Service()
export class Usuarios {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/usuarios`;

  /** true si el correo / nombre de usuario todavía no lo usa nadie */
  disponible(campo: 'correo' | 'nombreUsuario', valor: string): Observable<boolean> {
    const params = new HttpParams().set('campo', campo).set('valor', valor);
    return this.http
      .get<{ disponible: boolean }>(`${this.url}/disponibilidad`, { params })
      .pipe(map((respuesta) => respuesta.disponible));
  }
}
