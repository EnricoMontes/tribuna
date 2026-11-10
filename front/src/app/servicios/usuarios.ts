import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Perfil, Usuario } from '../modelos/usuario';

// Sprint 4: los filtros del dashboard (los mismos valores que acepta el back en ?estado=)
export type EstadoUsuarios = 'todos' | 'habilitados' | 'deshabilitados' | 'administradores';
export type ContadoresUsuarios = Record<EstadoUsuarios, number>;

export interface FiltrosUsuarios {
  offset: number;
  limit: number;
  estado: EstadoUsuarios;
  buscar?: string;
}

// Lo que devuelve GET /usuarios
export interface RespuestaUsuarios {
  usuarios: Usuario[];
  total: number;
  offset: number;
  limit: number;
  contadores: ContadoresUsuarios;
}

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

  /** PATCH /usuarios/mi-perfil (multipart: datos + fotoPerfil y/o banner). Devuelve el usuario actualizado. */
  editarPerfil(datos: FormData): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/mi-perfil`, datos);
  }

  // ───── Sprint 4: solo administradores (el back responde 403 a cualquier otro) ─────

  /** GET /usuarios paginado: una página + el total y los contadores de cada filtro */
  listar(filtros: FiltrosUsuarios): Observable<RespuestaUsuarios> {
    let params = new HttpParams()
      .set('offset', filtros.offset)
      .set('limit', filtros.limit)
      .set('estado', filtros.estado);
    if (filtros.buscar) {
      params = params.set('buscar', filtros.buscar);
    }
    return this.http.get<RespuestaUsuarios>(this.url, { params });
  }

  /** PATCH /usuarios/:id/perfil: dar o quitar el rol de administrador */
  cambiarPerfil(id: string, perfil: Perfil): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/${id}/perfil`, { perfil });
  }

  /** POST /usuarios (multipart): mismos datos que el registro + "perfil". No toca la sesión del admin. */
  crear(datos: FormData): Observable<Usuario> {
    return this.http.post<Usuario>(this.url, datos);
  }

  /** DELETE /usuarios/:id: baja lógica (no puede volver a ingresar) */
  deshabilitar(id: string): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.url}/${id}`);
  }

  /** POST /usuarios/:id/habilitar: alta lógica (vuelve a poder ingresar) */
  habilitar(id: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.url}/${id}/habilitar`, {});
  }
}
