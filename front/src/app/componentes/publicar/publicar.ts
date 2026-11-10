import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ImagenRespaldoDirective } from '../../directivas/imagen-respaldo.directive';
import { Partido } from '../../modelos/partido';
import { Modal } from '../../servicios/modal';
import { Partidos } from '../../servicios/partidos';
import { Publicaciones } from '../../servicios/publicaciones';
import { mensajeDeError } from '../../utilidades/errores';

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const MAXIMO_MB = 2;

@Component({
  imports: [ReactiveFormsModule, RouterLink, DatePipe, ImagenRespaldoDirective],
  selector: 'app-publicar',
  styleUrl: './publicar.css',
  templateUrl: './publicar.html',
})
export class Publicar implements OnDestroy {
  private publicaciones = inject(Publicaciones);
  private modal = inject(Modal);
  private router = inject(Router);

  // ?partido=<id> (por ejemplo, desde la página de un partido) llega como input
  partidoInicial = input<string | undefined>(undefined, { alias: 'partido' });

  partidos = toSignal(
    inject(Partidos)
      .listar()
      .pipe(catchError(() => of<Partido[]>([]))),
    { initialValue: [] },
  );

  // Los partidos agrupados por fecha ("Fecha 15", "Fecha 14"...) para el <select> con <optgroup>.
  // Como vienen del más reciente al más viejo, la primera fecha es la última que se jugó.
  fechas = computed(() => {
    const grupos = new Map<string, Partido[]>();
    for (const partido of this.partidos()) {
      grupos.set(partido.fecha, [...(grupos.get(partido.fecha) ?? []), partido]);
    }
    return [...grupos].map(([nombre, partidos]) => ({ nombre, partidos }));
  });

  formPublicar = new FormGroup({
    partidoId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    titulo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    mensaje: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
  });

  foto = signal<File | null>(null);
  vistaPrevia = signal<string | null>(null);
  errorFoto = signal('');
  enviando = signal(false);

  constructor() {
    // Si vino ?partido=..., queda elegido en el select
    effect(() => {
      const id = this.partidoInicial();
      if (id) {
        this.formPublicar.controls.partidoId.setValue(id);
      }
    });
  }

  partidoElegido(): Partido | undefined {
    const id = this.formPublicar.controls.partidoId.value;
    return this.partidos().find((partido) => partido.id === id);
  }

  mostrarError(campo: keyof Publicar['formPublicar']['controls']): boolean {
    const control = this.formPublicar.controls[campo];
    return control.touched && control.invalid;
  }

  elegirFoto(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.errorFoto.set('');
    if (archivo && !TIPOS_IMAGEN.includes(archivo.type)) {
      this.errorFoto.set('La foto tiene que ser JPG, PNG o WEBP');
      input.value = '';
      return;
    }
    if (archivo && archivo.size > MAXIMO_MB * 1024 * 1024) {
      this.errorFoto.set(`La foto no puede pesar más de ${MAXIMO_MB} MB`);
      input.value = '';
      return;
    }
    this.liberarVistaPrevia();
    this.foto.set(archivo);
    this.vistaPrevia.set(archivo ? URL.createObjectURL(archivo) : null);
  }

  quitarFoto(input: HTMLInputElement) {
    input.value = '';
    this.liberarVistaPrevia();
    this.foto.set(null);
    this.vistaPrevia.set(null);
  }

  publicar() {
    if (this.formPublicar.invalid) {
      this.formPublicar.markAllAsTouched();
      return;
    }
    const formData = new FormData();
    Object.entries(this.formPublicar.getRawValue()).forEach(([campo, valor]) =>
      formData.append(campo, valor),
    );
    const foto = this.foto();
    if (foto) {
      formData.append('imagen', foto);
    }

    this.enviando.set(true);
    this.publicaciones.crear(formData).subscribe({
      next: (publicacion) => {
        this.enviando.set(false);
        this.modal.exito('¡Publicado!', 'Tu publicación ya está en la tribuna.', () =>
          this.router.navigate(['/partidos', publicacion.partido.id]),
        );
      },
      error: (error) => {
        this.enviando.set(false);
        this.modal.error('No se pudo publicar', mensajeDeError(error));
      },
    });
  }

  ngOnDestroy() {
    this.liberarVistaPrevia();
  }

  private liberarVistaPrevia() {
    const url = this.vistaPrevia();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}
