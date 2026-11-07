import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Comentario } from '../../modelos/comentario';
import { Auth } from '../../servicios/auth';
import { Comentarios as ComentariosApi } from '../../servicios/comentarios';
import { Modal } from '../../servicios/modal';
import { mensajeDeError } from '../../utilidades/errores';
import { Cargando } from '../cargando/cargando';

const MAXIMO = 500;
// pattern(/\S/): que no sea solo espacios, tiene que haber al menos un carácter visible
const validadoresMensaje = [
  Validators.required,
  Validators.maxLength(MAXIMO),
  Validators.pattern(/\S/),
];

/**
 * Los comentarios de una publicación: escribir, editar los propios y "cargar más".
 * - La primera carga trae `porPagina` comentarios (los más recientes primero).
 * - "Cargar más" pide los siguientes con offset = cuántos ya tengo, y los SUMA abajo
 *   (no reemplaza la lista, como pide la consigna).
 * - El que escribió un comentario lo puede editar; uno editado muestra "(editado)".
 */
@Component({
  imports: [DatePipe, ReactiveFormsModule, Cargando],
  selector: 'app-comentarios',
  styleUrl: './comentarios.css',
  templateUrl: './comentarios.html',
})
export class Comentarios {
  private api = inject(ComentariosApi);
  private auth = inject(Auth);
  private modal = inject(Modal);

  publicacionId = input.required<string>();
  porPagina = input(5);
  totalCambio = output<number>(); // avisa a la tarjeta para que actualice "N comentarios"

  protected readonly maximo = MAXIMO;
  comentarios = signal<Comentario[]>([]);
  total = signal(0);
  cargando = signal(false);
  error = signal('');
  enviando = signal(false);
  editando = signal<string | null>(null); // id del comentario que se está editando
  guardando = signal(false);

  hayMas = computed(() => this.comentarios().length < this.total());

  nuevo = new FormControl('', { nonNullable: true, validators: validadoresMensaje });
  edicion = new FormControl('', { nonNullable: true, validators: validadoresMensaje });

  constructor() {
    // Si cambia la publicación se arranca de cero
    effect(() => {
      this.publicacionId();
      untracked(() => {
        this.comentarios.set([]);
        this.total.set(0);
        this.editando.set(null);
        this.cargarMas();
      });
    });
  }

  cargarMas() {
    this.cargando.set(true);
    this.error.set('');
    const offset = this.comentarios().length;
    this.api.listar(this.publicacionId(), offset, this.porPagina()).subscribe({
      next: (pagina) => {
        // Se agregan al final, salteando los que ya estaban (si alguien comentó mientras tanto,
        // la "página" se corre uno y podría repetirse un comentario)
        this.comentarios.update((actuales) => [
          ...actuales,
          ...pagina.comentarios.filter((c) => !actuales.some((a) => a._id === c._id)),
        ]);
        this.total.set(pagina.total);
        this.cargando.set(false);
      },
      error: (error) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(error));
      },
    });
  }

  comentar() {
    if (this.nuevo.invalid) {
      this.nuevo.markAsTouched();
      return;
    }
    this.enviando.set(true);
    this.api.crear(this.publicacionId(), this.nuevo.value.trim()).subscribe({
      next: (comentario) => {
        // El nuevo va arriba de todo: es el más reciente (mismo orden que devuelve la API)
        this.comentarios.update((lista) => [comentario, ...lista]);
        this.total.update((t) => t + 1);
        this.totalCambio.emit(this.total());
        this.nuevo.reset();
        this.enviando.set(false);
      },
      error: (error) => {
        this.enviando.set(false);
        this.modal.error('No se pudo comentar', mensajeDeError(error));
      },
    });
  }

  esMio(comentario: Comentario): boolean {
    return this.auth.usuario()?._id === comentario.autor._id;
  }

  empezarEdicion(comentario: Comentario) {
    this.edicion.reset(comentario.mensaje);
    this.editando.set(comentario._id);
  }

  cancelarEdicion() {
    this.editando.set(null);
  }

  guardarEdicion(comentario: Comentario) {
    if (this.edicion.invalid) {
      this.edicion.markAsTouched();
      return;
    }
    const mensaje = this.edicion.value.trim();
    if (mensaje === comentario.mensaje) {
      this.editando.set(null); // no cambió nada: no hace falta ir a la API
      return;
    }
    this.guardando.set(true);
    this.api.editar(this.publicacionId(), comentario._id, mensaje).subscribe({
      next: (editado) => {
        // Se reemplaza solo ese comentario (ya viene con modificado: true)
        this.comentarios.update((lista) => lista.map((c) => (c._id === editado._id ? editado : c)));
        this.editando.set(null);
        this.guardando.set(false);
      },
      error: (error) => {
        this.guardando.set(false);
        this.modal.error('No se pudo editar el comentario', mensajeDeError(error));
      },
    });
  }

  iniciales(autor: Comentario['autor']): string {
    return `${autor.nombre[0] ?? ''}${autor.apellido[0] ?? ''}`.toUpperCase();
  }
}
