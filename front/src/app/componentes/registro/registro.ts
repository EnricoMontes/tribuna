import { Component, inject, OnDestroy, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Cuadro } from '../../modelos/cuadro';
import { Auth } from '../../servicios/auth';
import { Cuadros } from '../../servicios/cuadros';
import { Modal } from '../../servicios/modal';
import { Usuarios } from '../../servicios/usuarios';
import { mensajeDeError } from '../../utilidades/errores';
import {
  clavesCoincidenValidator,
  correoValidator,
  disponibleValidator,
  edadMinimaValidator,
  passwordFuerteValidator,
} from '../../validadores/registro.validadores';

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const MAXIMO_MB = 2;
export const EDAD_MINIMA = 13;

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro implements OnDestroy {
  // inject() acá (y no en el constructor) porque el FormGroup de abajo ya necesita Usuarios
  private usuarios = inject(Usuarios);
  private auth = inject(Auth);
  private modal = inject(Modal);
  private router = inject(Router);

  // toSignal: convierte el observable de la lista de cuadros en un signal para usarlo en el template
  // (arranca vacío y se llena cuando responde el back)
  readonly categorias = toSignal(inject(Cuadros).listar(), { initialValue: [] });

  readonly edadMinima = EDAD_MINIMA;
  readonly anio = new Date().getFullYear();
  readonly hoy = new Date().toISOString().slice(0, 10); // tope del input date

  formRegistro = new FormGroup(
    {
      nombre: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(50)],
      }),
      apellido: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(50)],
      }),
      correo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, correoValidator()],
        asyncValidators: [disponibleValidator(this.usuarios, 'correo')],
      }),
      nombreUsuario: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9_.]{3,20}$/)],
        asyncValidators: [disponibleValidator(this.usuarios, 'nombreUsuario')],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, passwordFuerteValidator()],
      }),
      repetirPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      fechaNacimiento: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, edadMinimaValidator(EDAD_MINIMA)],
      }),
      descripcion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(200)],
      }),
      // Opcionales: el cuadro del que es hincha y su número de camiseta
      cuadroId: new FormControl('', { nonNullable: true }),
      numeroCamiseta: new FormControl<number | null>(null, {
        validators: [Validators.min(1), Validators.max(99), Validators.pattern(/^\d+$/)],
      }),
    },
    // Validador del grupo: las dos contraseñas tienen que ser iguales
    { validators: [clavesCoincidenValidator('password', 'repetirPassword')] },
  );

  // La foto no es un FormControl: un <input type="file"> se maneja leyendo el evento change
  foto = signal<File | null>(null);
  vistaPrevia = signal<string | null>(null);
  errorFoto = signal('');

  cargando = signal(false);
  verPassword = signal(false);

  /** El cuadro elegido en el select (para mostrar su escudo al lado y en el carnet) */
  cuadroElegido(): Cuadro | undefined {
    const id = this.formRegistro.controls.cuadroId.value;
    return this.categorias()
      .flatMap((categoria) => categoria.cuadros)
      .find((cuadro) => cuadro.id === id);
  }

  /** Iniciales para el carnet de socio mientras no haya foto */
  inicialesCarnet(): string {
    const { nombre, apellido } = this.formRegistro.controls;
    return `${nombre.value.trim()[0] ?? ''}${apellido.value.trim()[0] ?? ''}`.toUpperCase() || '?';
  }

  /** true si el campo se tocó y tiene errores (para pintar el borde rojo) */
  mostrarError(campo: keyof Registro['formRegistro']['controls']): boolean {
    const control = this.formRegistro.controls[campo];
    return control.touched && control.invalid;
  }

  /**
   * El correo se valida mientras se escribe, apenas aparece el @ (así "hincha@gmail" ya muestra
   * el error sin tener que salir del campo). Antes del @ esperamos al blur para no marcar en rojo
   * a la primera letra.
   */
  mostrarErrorCorreo(): boolean {
    const correo = this.formRegistro.controls.correo;
    return correo.invalid && (correo.touched || (correo.dirty && correo.value.includes('@')));
  }

  get noCoinciden(): boolean {
    return (
      this.formRegistro.hasError('clavesNoCoinciden') &&
      this.formRegistro.controls.repetirPassword.touched
    );
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

  registrarse() {
    if (this.formRegistro.invalid || this.formRegistro.pending) {
      this.formRegistro.markAllAsTouched();
      return;
    }

    // multipart/form-data: así viajan juntos los datos y el archivo. repetirPassword no se manda.
    const { repetirPassword, ...datos } = this.formRegistro.getRawValue();
    const formData = new FormData();
    // Los campos opcionales vacíos no se mandan (el back los guarda como null)
    Object.entries(datos).forEach(([campo, valor]) => {
      if (valor !== null && valor !== '') {
        formData.append(campo, String(valor));
      }
    });
    const foto = this.foto();
    if (foto) {
      formData.append('fotoPerfil', foto);
    }

    this.cargando.set(true);
    this.auth.registro(formData).subscribe({
      next: (usuario) => {
        this.cargando.set(false);
        this.modal.exito(
          '¡Bienvenido a la Tribuna!',
          `Tu cuenta @${usuario.nombreUsuario} se creó correctamente.`,
          () => this.router.navigate(['/publicaciones']),
        );
      },
      error: (error) => {
        this.cargando.set(false);
        this.modal.error('No pudimos crear tu cuenta', mensajeDeError(error));
      },
    });
  }

  // Ciclo de vida: al salir de la pantalla liberamos la URL temporal de la vista previa
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
