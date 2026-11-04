import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { catchError, Observable, of, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { Categoria } from '../modelos/cuadro';

@Service()
export class Cuadros {
  private http = inject(HttpClient);

  // shareReplay(1): la primera vez pide la lista al back y después reutiliza la misma respuesta
  // (si entrás varias veces al registro no se vuelve a pedir)
  private categorias$ = this.http.get<Categoria[]>(`${environment.apiUrl}/cuadros`).pipe(
    // El cuadro es opcional: si la API falla, el registro sigue andando sin la lista
    catchError(() => of<Categoria[]>([])),
    shareReplay(1),
  );

  /** Cuadros agrupados por categoría (Liga Profesional / Primera Nacional), con su escudo */
  listar(): Observable<Categoria[]> {
    return this.categorias$;
  }
}
