import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../servicios/auth';
import { Modal } from '../../servicios/modal';
import { mensajeDeError } from '../../utilidades/errores';
import { passwordFuerteValidator } from '../../validadores/registro.validadores';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  templateUrl: './login.html',
})
export class Login {
  formLogin = new FormGroup({
    // Correo O nombre de usuario: la API busca por cualquiera de los dos
    identificador: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, passwordFuerteValidator()],
    }),
  });

  cargando = signal(false);
  verPassword = signal(false);

  constructor(
    private auth: Auth,
    private modal: Modal,
    private router: Router,
  ) {}

  get identificador() {
    return this.formLogin.controls.identificador;
  }

  get password() {
    return this.formLogin.controls.password;
  }

  ingresar() {
    if (this.formLogin.invalid) {
      this.formLogin.markAllAsTouched(); // muestra los mensajes de todos los campos
      return;
    }
    const { identificador, password } = this.formLogin.getRawValue();
    this.cargando.set(true);

    // HttpClient devuelve un Observable: la petición sale recién cuando nos suscribimos
    this.auth.login(identificador, password).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/publicaciones']);
      },
      error: (error) => {
        this.cargando.set(false);
        this.modal.error('No pudimos iniciar sesión', mensajeDeError(error));
      },
    });
  }
}
