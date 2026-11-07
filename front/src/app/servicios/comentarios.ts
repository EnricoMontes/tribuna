import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Comentario, PaginaComentarios } from '../modelos/comentario';

// Los comentarios cuelgan de su publicación: /publicaciones/:id/comentarios
// (el token lo agrega el tokenInterceptor)
@Service()
export class Comentarios {
  private http = inject(HttpClient);
  private url = (idPublicacion: string) =>
    `${environment.apiUrl}/publicaciones/${idPublicacion}/comentarios`;

  /** GET ?offset=&limit= -> los más recientes primero */
  listar(idPublicacion: string, offset: number, limit: number): Observable<PaginaComentarios> {
    const params = new HttpParams().set('offset', offset).set('limit', limit);
    return this.http.get<PaginaComentarios>(this.url(idPublicacion), { params });
  }

  crear(idPublicacion: string, mensaje: string): Observable<Comentario> {
    return this.http.post<Comentario>(this.url(idPublicacion), { mensaje });
  }

  /** PUT: el back cambia el mensaje y marca modificado: true */
  editar(idPublicacion: string, idComentario: string, mensaje: string): Observable<Comentario> {
    return this.http.put<Comentario>(`${this.url(idPublicacion)}/${idComentario}`, { mensaje });
  }
}
