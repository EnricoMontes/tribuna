import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../modelos/usuario';

const CLAVE_SESION = 'tribuna_usuario';

@Service()
export class Auth {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/auth`;

  // Usuario logueado. Es un signal: navbar y Mi Perfil se actualizan solos cuando cambia.
  usuario = signal<Usuario | null>(this.leerSesionGuardada());
  logueado = computed(() => this.usuario() !== null);

  // FormData porque viaja un archivo (la foto): el navegador arma el multipart/form-data
  registro(datos: FormData): Observable<Usuario> {
    return this.http
      .post<Usuario>(`${this.url}/registro`, datos)
      .pipe(tap((usuario) => this.guardarSesion(usuario)));
  }

  login(identificador: string, password: string): Observable<Usuario> {
    return this.http
      .post<Usuario>(`${this.url}/login`, { identificador, password })
      .pipe(tap((usuario) => this.guardarSesion(usuario)));
  }

  cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
    this.usuario.set(null);
  }

  // Sprint 1: se guardan los datos del usuario para no perder la sesión al recargar (F5).
  // En el sprint 3 se reemplaza por el token JWT que devuelva la API.
  private guardarSesion(usuario: Usuario) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
    this.usuario.set(usuario);
  }

  private leerSesionGuardada(): Usuario | null {
    try {
      const guardado = localStorage.getItem(CLAVE_SESION);
      return guardado ? (JSON.parse(guardado) as Usuario) : null;
    } catch {
      return null;
    }
  }
}
