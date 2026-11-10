import { DatePipe } from '@angular/common';
import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { Usuario } from '../../modelos/usuario';
import { Auth } from '../../servicios/auth';
import { Modal } from '../../servicios/modal';
import { Usuarios } from '../../servicios/usuarios';
import { mensajeDeError } from '../../utilidades/errores';
import { Registro } from '../registro/registro';

type Filtro = 'todos' | 'habilitados' | 'deshabilitados' | 'administradores';

/**
 * Sprint 4 — dashboard/usuarios (solo administradores):
 * - listado de usuarios (GET /usuarios), con filtros y búsqueda;
 * - alta de usuarios: el formulario del registro en modoAdmin, con los radio buttons de perfil;
 * - baja lógica (deshabilitar, con confirmación) y alta lógica (habilitar).
 */
@Component({
  imports: [DatePipe, Registro],
  selector: 'app-dashboard-usuarios',
  styleUrl: './dashboard-usuarios.css',
  templateUrl: './dashboard-usuarios.html',
})
export class DashboardUsuarios implements OnInit {
  private usuariosApi = inject(Usuarios);
  private modal = inject(Modal);
  auth = inject(Auth);

  usuarios = signal<Usuario[]>([]);
  cargando = signal(true);
  errorCarga = signal('');

  filtro = signal<Filtro>('todos');
  busqueda = signal('');
  creando = signal(false); // ventana "Nuevo usuario" abierta
  procesando = signal<string | null>(null); // id del usuario que se está habilitando/deshabilitando

  // Los usuarios viejos no tienen el campo en la base: sin "habilitado" = habilitado
  estaHabilitado = (usuario: Usuario) => usuario.habilitado !== false;

  // computed: se recalculan solos cuando cambia la lista, el filtro o la búsqueda
  contadores = computed(() => {
    const lista = this.usuarios();
    const habilitados = lista.filter(this.estaHabilitado).length;
    return {
      todos: lista.length,
      habilitados,
      deshabilitados: lista.length - habilitados,
      administradores: lista.filter((u) => u.perfil === 'administrador').length,
    };
  });

  visibles = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.usuarios().filter((usuario) => {
      const pasaFiltro =
        this.filtro() === 'todos' ||
        (this.filtro() === 'habilitados' && this.estaHabilitado(usuario)) ||
        (this.filtro() === 'deshabilitados' && !this.estaHabilitado(usuario)) ||
        (this.filtro() === 'administradores' && usuario.perfil === 'administrador');
      const buscado = `${usuario.nombre} ${usuario.apellido} ${usuario.nombreUsuario} ${usuario.correo}`;
      return pasaFiltro && buscado.toLowerCase().includes(texto);
    });
  });

  readonly filtros: { valor: Filtro; texto: string }[] = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'habilitados', texto: 'Habilitados' },
    { valor: 'deshabilitados', texto: 'Deshabilitados' },
    { valor: 'administradores', texto: 'Administradores' },
  ];

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.errorCarga.set('');
    this.usuariosApi.listar().subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  esYo(usuario: Usuario): boolean {
    return usuario._id === this.auth.usuario()?._id;
  }

  iniciales(usuario: Usuario): string {
    return `${usuario.nombre[0] ?? ''}${usuario.apellido[0] ?? ''}`.toUpperCase();
  }

  buscar(evento: Event) {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  /** Baja lógica: se pide confirmación con el modal (nunca confirm()) */
  deshabilitar(usuario: Usuario) {
    this.modal.confirmar(
      `¿Deshabilitar a @${usuario.nombreUsuario}?`,
      'No va a poder ingresar a Tribuna: al intentar el login se le avisa que su cuenta fue deshabilitada. ' +
        'Sus publicaciones no se borran y podés volver a habilitarlo cuando quieras.',
      'Deshabilitar',
      () => this.cambiarEstado(usuario, false),
    );
  }

  /** Alta lógica: no hace falta confirmar, porque no le quita nada a nadie */
  habilitar(usuario: Usuario) {
    this.cambiarEstado(usuario, true);
  }

  /** Se cerró la ventana con un usuario nuevo: se agrega arriba de la lista (sin volver a pedirla) */
  alCrear(usuario: Usuario) {
    this.usuarios.update((lista) => [usuario, ...lista]);
    this.creando.set(false);
    this.filtro.set('todos');
  }

  // Escape cierra la ventana de alta (como el resto de los modales de la app)
  @HostListener('document:keydown.escape')
  cerrarConEscape() {
    this.creando.set(false);
  }

  private cambiarEstado(usuario: Usuario, habilitar: boolean) {
    this.procesando.set(usuario._id);
    const pedido = habilitar
      ? this.usuariosApi.habilitar(usuario._id)
      : this.usuariosApi.deshabilitar(usuario._id);

    pedido.subscribe({
      next: (actualizado) => {
        this.procesando.set(null);
        // Se reemplaza solo ese usuario en la lista (update devuelve un array nuevo -> el signal avisa)
        this.usuarios.update((lista) =>
          lista.map((u) => (u._id === actualizado._id ? actualizado : u)),
        );
        this.modal.exito(
          habilitar ? 'Usuario habilitado' : 'Usuario deshabilitado',
          habilitar
            ? `@${actualizado.nombreUsuario} ya puede volver a ingresar a Tribuna.`
            : `@${actualizado.nombreUsuario} ya no puede ingresar a Tribuna.`,
        );
      },
      error: (error) => {
        this.procesando.set(null);
        this.modal.error('No pudimos cambiar el estado del usuario', mensajeDeError(error));
      },
    });
  }
}
