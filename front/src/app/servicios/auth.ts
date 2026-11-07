import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, map, Observable, of, shareReplay, tap, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../modelos/usuario';
import { Modal } from './modal';

const CLAVE_USUARIO = 'tribuna_usuario';
const CLAVE_TOKEN = 'tribuna_token';
const CLAVE_VENCE = 'tribuna_token_vence'; // cuándo vence el token, según el reloj de ESTA compu

// El aviso sale 5 minutos antes de que venza el token (que dura 15): a los 10 minutos de entrar
const AVISO_ANTES_DE_VENCER = 5 * 60 * 1000;
// La pantalla de carga se muestra al menos esto, para que no sea un parpadeo si la API responde rápido
const DURACION_MINIMA_CARGA = 800;

// Lo que devuelven POST /auth/login y POST /auth/registro
interface RespuestaAuth {
  usuario: Usuario;
  token: string; // JWT firmado por el back, vence a los 15 minutos
}

@Service()
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private modal = inject(Modal);
  private url = `${environment.apiUrl}/auth`;

  // Usuario logueado. Es un signal: navbar y Mi Perfil se actualizan solos cuando cambia.
  usuario = signal<Usuario | null>(this.leerSesionGuardada());
  logueado = computed(() => this.usuario() !== null);

  // Pantalla de carga del inicio: true mientras se valida el token contra POST /auth/autorizar
  verificando = signal(true);
  private verificacion$?: Observable<boolean>;

  // Los dos timers de la sesión (se cancelan al cerrar sesión o al refrescar el token)
  private timerAviso?: ReturnType<typeof setTimeout>;
  private timerVencimiento?: ReturnType<typeof setTimeout>;

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

  /**
   * Al iniciar la app: POST /auth/autorizar con el token guardado.
   * - 200 -> el token es válido: se actualizan los datos del usuario y arrancan los timers.
   * - 401 (o sin token) -> se borra la sesión. El guard lo manda al login.
   * shareReplay(1): la petición sale UNA sola vez aunque se suscriban varios (App y el guard)
   * y el que llega tarde recibe el mismo resultado.
   */
  verificarSesion(): Observable<boolean> {
    this.verificacion$ ??= forkJoin([this.pedirAutorizacion(), timer(DURACION_MINIMA_CARGA)]).pipe(
      map(([valida]) => valida),
      finalize(() => this.verificando.set(false)),
      shareReplay(1),
    );
    return this.verificacion$;
  }

  /** POST /auth/refrescar: token nuevo con otros 15 minutos (lo pide el modal "¿Extender sesión?") */
  refrescar(): Observable<void> {
    return this.http.post<{ token: string }>(`${this.url}/refrescar`, {}).pipe(
      tap(({ token }) => {
        this.guardarToken(token);
        this.programarTimers();
      }),
      map(() => undefined),
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
    this.cancelarTimers();
    localStorage.removeItem(CLAVE_USUARIO);
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_VENCE);
    this.usuario.set(null);
  }

  /** La sesión venció (timer de los 15 min o un 401 de la API): se cierra y se vuelve al login */
  sesionVencida() {
    if (!this.token()) return; // ya se había cerrado (por ejemplo, dos 401 seguidos)
    this.cerrarSesion();
    this.router.navigate(['/login']);
    this.modal.info(
      'Tu sesión venció',
      'Por seguridad, volvé a ingresar para seguir en la tribuna.',
    );
  }

  private pedirAutorizacion(): Observable<boolean> {
    if (!this.token()) {
      this.cerrarSesion();
      return of(false);
    }
    return this.http.post<{ usuario: Usuario }>(`${this.url}/autorizar`, {}).pipe(
      map(({ usuario }) => {
        this.actualizarUsuario(usuario); // datos frescos de la base (por si cambiaron en otro lado)
        this.programarTimers();
        return true;
      }),
      catchError(() => {
        this.cerrarSesion();
        return of(false);
      }),
    );
  }

  // El token se guarda en localStorage (la consigna lo permite; la alternativa eran cookies).
  // Los datos del usuario también, para no perder la sesión al recargar (F5).
  private guardarSesion({ usuario, token }: RespuestaAuth) {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    this.guardarToken(token);
    this.usuario.set(usuario);
    this.verificando.set(false); // recién logueado: no hay nada que verificar
    this.programarTimers();
  }

  /**
   * Guarda el token y CUÁNDO vence, medido con el reloj de esta compu:
   * ahora + duración del token (exp - iat, lo que firmó el back: 15 minutos).
   * No se usa "exp" directo porque es la hora del SERVIDOR: si la compu del usuario tiene la hora
   * corrida unos minutos, el aviso saldría antes o después de tiempo.
   */
  private guardarToken(token: string) {
    localStorage.setItem(CLAVE_TOKEN, token);
    const duracion = this.leerDuracion(token);
    if (duracion) {
      localStorage.setItem(CLAVE_VENCE, String(Date.now() + duracion));
    }
  }

  /**
   * Los timers salen del vencimiento guardado, no de un "10 minutos" fijo: así funcionan igual
   * al iniciar sesión (aviso a los 10 min) que al recargar la página a mitad de la sesión
   * (el aviso sale cuando falten 5 minutos, no 10 minutos después del F5).
   */
  private programarTimers() {
    this.cancelarTimers();
    const vence = Number(localStorage.getItem(CLAVE_VENCE));
    if (!vence) return;
    const falta = vence - Date.now();

    this.timerAviso = setTimeout(
      () => this.preguntarSiExtiende(),
      Math.max(0, falta - AVISO_ANTES_DE_VENCER),
    );
    this.timerVencimiento = setTimeout(() => this.sesionVencida(), Math.max(0, falta));
  }

  private preguntarSiExtiende() {
    this.modal.confirmar(
      'Tu sesión vence en 5 minutos',
      '¿Querés extenderla? Si no, vas a tener que volver a ingresar.',
      'Extender sesión',
      () =>
        this.refrescar().subscribe({
          next: () => this.modal.exito('Sesión extendida', 'Tenés 15 minutos más en la tribuna.'),
          error: () => this.sesionVencida(),
        }),
      false, // no es una acción peligrosa: botón azul, no rojo
    );
  }

  private cancelarTimers() {
    clearTimeout(this.timerAviso);
    clearTimeout(this.timerVencimiento);
  }

  /**
   * El JWT es cabecera.payload.firma en Base64URL: el payload se puede LEER sin la clave
   * (por eso nunca lleva la contraseña). Lo que no se puede es modificarlo sin romper la firma.
   * "iat" = cuándo se emitió y "exp" = cuándo vence (en segundos).
   * Devuelve cuánto dura el token en milisegundos, o null si no tiene el formato esperado.
   */
  private leerDuracion(token: string): number | null {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const { iat, exp } = JSON.parse(atob(base64)) as { iat?: number; exp?: number };
      return iat && exp ? (exp - iat) * 1000 : null;
    } catch {
      return null;
    }
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
