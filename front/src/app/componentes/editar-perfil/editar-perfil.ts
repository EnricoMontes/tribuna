import { Component, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EscapeDirective } from '../../directivas/escape.directive';
import { ImagenRespaldoDirective } from '../../directivas/imagen-respaldo.directive';
import { Usuario } from '../../modelos/usuario';
import { Cuadros } from '../../servicios/cuadros';
import { Modal } from '../../servicios/modal';
import { Usuarios } from '../../servicios/usuarios';
import { mensajeDeError } from '../../utilidades/errores';

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const MAXIMO_MB = 2;

// Una imagen editable (foto de perfil o banner): el archivo nuevo, su vista previa y si se quiere sacar
interface EstadoImagen {
  archivo: File | null;
  vistaPrevia: string | null;
  quitar: boolean;
  error: string;
}
const SIN_CAMBIOS: EstadoImagen = { archivo: null, vistaPrevia: null, quitar: false, error: '' };

/**
 * Ventana para editar Mi perfil (se abre con el lápiz).
 * input usuario: los datos actuales. output guardado: el usuario ya actualizado por la API.
 */
@Component({
  imports: [ReactiveFormsModule, EscapeDirective, ImagenRespaldoDirective],
  selector: 'app-editar-perfil',
  styleUrl: './editar-perfil.css',
  templateUrl: './editar-perfil.html',
})
export class EditarPerfil implements OnInit, OnDestroy {
  private usuariosApi = inject(Usuarios);
  private modal = inject(Modal);

  usuario = input.required<Usuario>();
  cerrar = output<void>();
  guardado = output<Usuario>();

  categorias = toSignal(inject(Cuadros).listar(), { initialValue: [] });

  form = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    apellido: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    cuadroId: new FormControl('', { nonNullable: true }),
    numeroCamiseta: new FormControl<number | null>(null, {
      validators: [Validators.min(1), Validators.max(99), Validators.pattern(/^\d+$/)],
    }),
  });

  foto = signal<EstadoImagen>(SIN_CAMBIOS);
  banner = signal<EstadoImagen>(SIN_CAMBIOS);
  guardando = signal(false);

  // Ciclo de vida: en ngOnInit los inputs ya tienen valor (en el constructor todavía no)
  ngOnInit() {
    const u = this.usuario();
    this.form.setValue({
      nombre: u.nombre,
      apellido: u.apellido,
      descripcion: u.descripcion ?? '',
      cuadroId: u.cuadro?.id ?? '',
      numeroCamiseta: u.numeroCamiseta ?? null,
    });
  }

  /** Lo que se ve en la vista previa: la imagen nueva, nada si se quitó, o la actual */
  imagenActual(cual: 'foto' | 'banner'): string | null {
    const estado = cual === 'foto' ? this.foto() : this.banner();
    if (estado.vistaPrevia) return estado.vistaPrevia;
    if (estado.quitar) return null;
    return cual === 'foto' ? this.usuario().fotoPerfil : (this.usuario().banner ?? null);
  }

  escudoElegido(): string | undefined {
    const id = this.form.controls.cuadroId.value;
    return this.categorias()
      .flatMap((c) => c.cuadros)
      .find((c) => c.id === id)?.escudo;
  }

  mostrarError(campo: keyof EditarPerfil['form']['controls']): boolean {
    const control = this.form.controls[campo];
    return control.touched && control.invalid;
  }

  elegirImagen(cual: 'foto' | 'banner', evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = ''; // así se puede volver a elegir el mismo archivo
    if (!archivo) return;
    const estado = cual === 'foto' ? this.foto : this.banner;
    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      estado.set({ ...estado(), error: 'La imagen tiene que ser JPG, PNG o WEBP' });
      return;
    }
    if (archivo.size > MAXIMO_MB * 1024 * 1024) {
      estado.set({ ...estado(), error: `La imagen no puede pesar más de ${MAXIMO_MB} MB` });
      return;
    }
    this.liberar(estado());
    estado.set({ archivo, vistaPrevia: URL.createObjectURL(archivo), quitar: false, error: '' });
  }

  quitarImagen(cual: 'foto' | 'banner') {
    const estado = cual === 'foto' ? this.foto : this.banner;
    this.liberar(estado());
    estado.set({ ...SIN_CAMBIOS, quitar: true });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // multipart/form-data: datos + (si hay) las imágenes nuevas.
    // Cuadro o número vacíos ('') le dicen al back que los saque.
    const datos = new FormData();
    const valores = this.form.getRawValue();
    datos.append('nombre', valores.nombre);
    datos.append('apellido', valores.apellido);
    datos.append('descripcion', valores.descripcion);
    datos.append('cuadroId', valores.cuadroId);
    datos.append('numeroCamiseta', valores.numeroCamiseta === null ? '' : String(valores.numeroCamiseta));
    const foto = this.foto();
    const banner = this.banner();
    if (foto.archivo) datos.append('fotoPerfil', foto.archivo);
    if (foto.quitar) datos.append('quitarFotoPerfil', 'true');
    if (banner.archivo) datos.append('banner', banner.archivo);
    if (banner.quitar) datos.append('quitarBanner', 'true');

    this.guardando.set(true);
    this.usuariosApi.editarPerfil(datos).subscribe({
      next: (usuario) => {
        this.guardando.set(false);
        this.guardado.emit(usuario);
      },
      error: (error) => {
        this.guardando.set(false);
        this.modal.error('No se pudo guardar el perfil', mensajeDeError(error));
      },
    });
  }

  // Lo llama la directiva propia (appEscape) del fondo de la ventana
  alPresionarEscape() {
    if (!this.guardando()) this.cerrar.emit();
  }

  // Ciclo de vida: al cerrar, se liberan las URLs temporales de las vistas previas
  ngOnDestroy() {
    this.liberar(this.foto());
    this.liberar(this.banner());
  }

  private liberar(estado: EstadoImagen) {
    if (estado.vistaPrevia) URL.revokeObjectURL(estado.vistaPrevia);
  }
}
