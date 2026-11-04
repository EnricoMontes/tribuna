import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../modelos/usuario';

const CLAVE_USUARIO = 'tribuna_usuario';
const CLAVE_TOKEN = 'tribuna_token';

// Lo que devuelven POST /auth/login y POST /auth/registro
interface RespuestaAuth {
  usuario: Usuario;
  token: string; // JWT firmado por el back, vence a los 15 minutos
}

@Service()
export class Auth {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/auth`;

  // Usuario logueado. Es un signal: navbar y Mi Perfil se actualizan solos cuando cambia.
  usuario = signal<Usuario | null>(this.leerSesionGuardada());
  logueado = computed(() => this.usuario() !== null);

  // FormData porque viaja un archivo (la foto): el navegador arma el multipart/form-data
  registro(datos: FormData): Observable<Usuario> {
    return this.http.post<RespuestaAuth>(`${this.url}/registro`, datos).pipe(
      tap((respuesta) => this.guardarSesion(respuesta)),
      map((respuesta) => respuesta.usuario),
    );
  }

  login(identificador: string, password: string): Observable<Usuario> {
    return this.http.post<RespuestaAuth>(`${this.url}/login`, { identificador, password }).pipe(
      tap((respuesta) => this.guardarSesion(respuesta)),
      map((respuesta) => respuesta.usuario),
    );
  }

  /** El interceptor lo usa para mandar "Authorization: Bearer <token>" en cada petición */
  token(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  /** Después de editar el perfil: el signal y el localStorage quedan con los datos nuevos */
  actualizarUsuario(usuario: Usuario) {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    this.usuario.set(usuario);
  }

  cerrarSesion() {
    localStorage.removeItem(CLAVE_USUARIO);
    localStorage.removeItem(CLAVE_TOKEN);
    this.usuario.set(null);
  }

  // El token se guarda en localStorage (el profe lo aceptó; la alternativa eran cookies).
  // Los datos del usuario también, para no perder la sesión al recargar (F5).
  // En el sprint 3 se agrega POST /auth/autorizar para validar el token al abrir la app.
  private guardarSesion({ usuario, token }: RespuestaAuth) {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    localStorage.setItem(CLAVE_TOKEN, token);
    this.usuario.set(usuario);
  }

  private leerSesionGuardada(): Usuario | null {
    try {
      const guardado = localStorage.getItem(CLAVE_USUARIO);
      // Sin token no hay sesión (por ejemplo, una sesión vieja del sprint 1)
      if (!guardado || !localStorage.getItem(CLAVE_TOKEN)) {
        return null;
      }
      return JSON.parse(guardado) as Usuario;
    } catch {
      return null;
    }
  }
}
