import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Partido } from '../modelos/partido';

@Service()
export class Partidos {
  private http = inject(HttpClient);

  /** Partidos ya jugados del torneo actual de la Liga Profesional, del más reciente al más viejo */
  listar(): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${environment.apiUrl}/partidos`);
  }
}
