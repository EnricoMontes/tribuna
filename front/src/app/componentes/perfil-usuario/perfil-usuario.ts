import { DatePipe, Location } from '@angular/common';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ImagenRespaldoDirective } from '../../directivas/imagen-respaldo.directive';
import { UsuarioPublico } from '../../modelos/usuario';
import { InicialesPipe } from '../../pipes/iniciales.pipe';
import { Auth } from '../../servicios/auth';
import { Usuarios } from '../../servicios/usuarios';
import { mensajeDeError } from '../../utilidades/errores';
import { Cargando } from '../cargando/cargando';
import { ListaPublicaciones } from '../lista-publicaciones/lista-publicaciones';

/**
 * Perfil de OTRO usuario: /usuarios/:nombreUsuario (se entra tocando su nombre o su foto).
 * Es SOLO para ver: no hay lápiz ni formulario, y el back no tiene ninguna ruta para editar a
 * otro (PATCH /usuarios/mi-perfil edita siempre al usuario del token).
 * No muestra correo ni fecha de nacimiento: el back ni siquiera los manda.
 * Si es mi propio usuario, va a Mi perfil (donde sí puedo editar).
 * Usa la misma hoja de estilos que Mi perfil, así las dos fichas se ven iguales.
 */
@Component({
  imports: [
    RouterLink,
    DatePipe,
    Cargando,
    ListaPublicaciones,
    InicialesPipe,
    ImagenRespaldoDirective,
  ],
  selector: 'app-perfil-usuario',
  styleUrls: ['../mi-perfil/mi-perfil.css', './perfil-usuario.css'],
  templateUrl: './perfil-usuario.html',
})
export class PerfilUsuario {
  private api = inject(Usuarios);
  private auth = inject(Auth);
  private router = inject(Router);
  private location = inject(Location);

  nombreUsuario = input.required<string>(); // el :nombreUsuario de la ruta

  usuario = signal<UsuarioPublico | null>(null);
  error = signal('');

  constructor() {
    effect(() => {
      const nombre = this.nombreUsuario();
      untracked(() => this.cargar(nombre));
    });
  }

  cargar(nombreUsuario: string) {
    // Mi propio perfil -> Mi perfil (replaceUrl: así "atrás" no vuelve a esta redirección)
    if (nombreUsuario.toLowerCase() === this.auth.usuario()?.nombreUsuario) {
      this.router.navigate(['/mi-perfil'], { replaceUrl: true });
      return;
    }
    this.usuario.set(null);
    this.error.set('');
    this.api.perfilPublico(nombreUsuario).subscribe({
      next: (usuario) => this.usuario.set(usuario),
      error: (error) => this.error.set(mensajeDeError(error)),
    });
  }

  volver() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/publicaciones']);
    }
  }
}
