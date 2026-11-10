import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../modelos/usuario';

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

  /** GET /usuarios: todos los usuarios, habilitados y deshabilitados */
  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url);
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
