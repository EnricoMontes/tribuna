import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Perfil, Usuario } from '../../modelos/usuario';
import { Auth } from '../../servicios/auth';
import { Modal } from '../../servicios/modal';
import { ContadoresUsuarios, EstadoUsuarios, Usuarios } from '../../servicios/usuarios';
import { mensajeDeError } from '../../utilidades/errores';
import { Registro } from '../registro/registro';

const POR_PAGINA = 10;
const ESPERA_BUSQUEDA = 400; // ms sin tipear antes de pedirle la búsqueda al back

/**
 * Sprint 4 — dashboard/usuarios (solo administradores):
 * - listado PAGINADO en el back (GET /usuarios?offset&limit&estado&buscar), con filtros y búsqueda;
 * - alta de usuarios: el formulario del registro en modoAdmin, con los radio buttons de perfil;
 * - baja lógica (deshabilitar, con confirmación) y alta lógica (habilitar);
 * - dar o quitar el rol de administrador a un usuario que ya existe.
 */
@Component({
  imports: [DatePipe, Registro],
  selector: 'app-dashboard-usuarios',
  styleUrl: './dashboard-usuarios.css',
  templateUrl: './dashboard-usuarios.html',
})
export class DashboardUsuarios implements OnInit, OnDestroy {
  private usuariosApi = inject(Usuarios);
  private modal = inject(Modal);
  auth = inject(Auth);

  // La página que mandó el back (solo POR_PAGINA usuarios, no todos)
  usuarios = signal<Usuario[]>([]);
  total = signal(0); // cuántos hay en total con el filtro y la búsqueda actuales
  contadores = signal<ContadoresUsuarios>({
    todos: 0,
    habilitados: 0,
    deshabilitados: 0,
    administradores: 0,
  });

  pagina = signal(1);
  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / POR_PAGINA)));

  filtro = signal<EstadoUsuarios>('todos');
  busqueda = signal('');
  private timerBusqueda?: ReturnType<typeof setTimeout>;

  cargando = signal(true);
  errorCarga = signal('');
  creando = signal(false); // ventana "Nuevo usuario" abierta
  procesando = signal<string | null>(null); // id del usuario con una acción en curso (evita doble click)

  readonly filtros: { valor: EstadoUsuarios; texto: string }[] = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'habilitados', texto: 'Habilitados' },
    { valor: 'deshabilitados', texto: 'Deshabilitados' },
    { valor: 'administradores', texto: 'Administradores' },
  ];

  // Los usuarios viejos no tienen el campo en la base: sin "habilitado" = habilitado
  estaHabilitado = (usuario: Usuario) => usuario.habilitado !== false;

  ngOnInit() {
    this.cargar();
  }

  /** Pide al back la página actual con el filtro y la búsqueda actuales */
  cargar() {
    this.cargando.set(true);
    this.errorCarga.set('');
    this.usuariosApi
      .listar({
        offset: (this.pagina() - 1) * POR_PAGINA,
        limit: POR_PAGINA,
        estado: this.filtro(),
        buscar: this.busqueda().trim(),
      })
      .subscribe({
        next: (respuesta) => {
          // Si la página quedó vacía (por ejemplo, se deshabilitó el último de la última página
          // con el filtro "Habilitados"), se vuelve a la anterior
          if (respuesta.usuarios.length === 0 && this.pagina() > 1) {
            this.pagina.update((p) => p - 1);
            this.cargar();
            return;
          }
          this.usuarios.set(respuesta.usuarios);
          this.total.set(respuesta.total);
          this.contadores.set(respuesta.contadores);
          this.cargando.set(false);
        },
        error: (error) => {
          this.errorCarga.set(mensajeDeError(error));
          this.cargando.set(false);
        },
      });
  }

  irAPagina(pagina: number) {
    this.pagina.set(pagina);
    this.cargar();
  }

  /** Al cambiar el filtro se vuelve a la página 1 (la 3 de "Todos" puede no existir en "Deshabilitados") */
  elegirFiltro(filtro: EstadoUsuarios) {
    this.filtro.set(filtro);
    this.pagina.set(1);
    this.cargar();
  }

  /**
   * La búsqueda la hace el back (si la hiciera el front, solo buscaría en la página actual).
   * Se espera a que deje de tipear (ESPERA_BUSQUEDA) para no mandar un pedido por cada letra.
   */
  buscar(evento: Event) {
    this.busqueda.set((evento.target as HTMLInputElement).value);
    clearTimeout(this.timerBusqueda);
    this.timerBusqueda = setTimeout(() => {
      this.pagina.set(1);
      this.cargar();
    }, ESPERA_BUSQUEDA);
  }

  esYo(usuario: Usuario): boolean {
    return usuario._id === this.auth.usuario()?._id;
  }

  iniciales(usuario: Usuario): string {
    return `${usuario.nombre[0] ?? ''}${usuario.apellido[0] ?? ''}`.toUpperCase();
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

  /** Dar o quitar el rol de administrador, con confirmación */
  cambiarPerfil(usuario: Usuario) {
    const nuevo: Perfil = usuario.perfil === 'administrador' ? 'usuario' : 'administrador';
    const haciendoAdmin = nuevo === 'administrador';
    this.modal.confirmar(
      haciendoAdmin
        ? `¿Hacer administrador a @${usuario.nombreUsuario}?`
        : `¿Quitarle el rol de administrador a @${usuario.nombreUsuario}?`,
      (haciendoAdmin
        ? 'Va a poder dar de baja cualquier publicación y entrar a este dashboard. '
        : 'Va a volver a ser un usuario común. ') +
        'El cambio se aplica cuando cierre sesión y vuelva a ingresar.',
      haciendoAdmin ? 'Hacer administrador' : 'Quitar rol',
      () => this.guardarPerfil(usuario, nuevo),
      !haciendoAdmin, // quitar el rol va en rojo; dar el rol, en azul
    );
  }

  /** Se creó un usuario: se vuelve a "Todos", página 1, donde aparece primero (es el más nuevo) */
  alCrear() {
    this.creando.set(false);
    this.filtro.set('todos');
    this.busqueda.set('');
    this.pagina.set(1);
    this.cargar();
  }

  // Escape cierra la ventana de alta (como el resto de los modales de la app)
  @HostListener('document:keydown.escape')
  cerrarConEscape() {
    this.creando.set(false);
  }

  ngOnDestroy() {
    clearTimeout(this.timerBusqueda);
  }

  private cambiarEstado(usuario: Usuario, habilitar: boolean) {
    this.procesando.set(usuario._id);
    const pedido = habilitar
      ? this.usuariosApi.habilitar(usuario._id)
      : this.usuariosApi.deshabilitar(usuario._id);

    pedido.subscribe({
      next: (actualizado) => {
        this.procesando.set(null);
        this.modal.exito(
          habilitar ? 'Usuario habilitado' : 'Usuario deshabilitado',
          habilitar
            ? `@${actualizado.nombreUsuario} ya puede volver a ingresar a Tribuna.`
            : `@${actualizado.nombreUsuario} ya no puede ingresar a Tribuna.`,
        );
        // Se vuelve a pedir la página: cambian los contadores y puede salir del filtro actual
        this.cargar();
      },
      error: (error) => {
        this.procesando.set(null);
        this.modal.error('No pudimos cambiar el estado del usuario', mensajeDeError(error));
      },
    });
  }

  private guardarPerfil(usuario: Usuario, perfil: Perfil) {
    this.procesando.set(usuario._id);
    this.usuariosApi.cambiarPerfil(usuario._id, perfil).subscribe({
      next: (actualizado) => {
        this.procesando.set(null);
        this.modal.exito(
          perfil === 'administrador' ? 'Ahora es administrador' : 'Ahora es usuario',
          `@${actualizado.nombreUsuario} ahora tiene el perfil "${actualizado.perfil}". ` +
            'Lo va a ver cuando cierre sesión y vuelva a ingresar.',
        );
        this.cargar();
      },
      error: (error) => {
        this.procesando.set(null);
        this.modal.error('No pudimos cambiar el perfil', mensajeDeError(error));
      },
    });
  }
}
