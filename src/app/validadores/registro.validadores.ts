import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { catchError, map, of, switchMap, timer } from 'rxjs';
import { Usuarios } from '../servicios/usuarios';

/** Mínimo 8 caracteres, una mayúscula y un número. Devuelve un error por cada regla que falta. */
export function passwordFuerteValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = control.value ?? '';
    if (!valor) {
      return null; // de "vacío" se encarga Validators.required
    }
    const errores: ValidationErrors = {};
    if (valor.length < 8) errores['passwordCorta'] = true;
    if (!/[A-Z]/.test(valor)) errores['passwordSinMayuscula'] = true;
    if (!/\d/.test(valor)) errores['passwordSinNumero'] = true;
    return Object.keys(errores).length ? errores : null;
  };
}

/**
 * Validador de GRUPO: compara dos controles del mismo formulario.
 * Va en el FormGroup (y no en un control) para que se recalcule si cambia cualquiera de los dos.
 */
export function clavesCoincidenValidator(campo: string, campoRepetido: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const valor = grupo.get(campo)?.value;
    const repetido = grupo.get(campoRepetido)?.value;
    if (!repetido) {
      return null;
    }
    return valor === repetido ? null : { clavesNoCoinciden: true };
  };
}

/** Fecha (yyyy-mm-dd del input date) que no sea futura y con una edad mínima. */
export function edadMinimaValidator(edadMinima: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const nacimiento = new Date(control.value + 'T00:00');
    const hoy = new Date();
    if (nacimiento > hoy) {
      return { fechaFutura: true };
    }
    const fechaLimite = new Date(hoy.getFullYear() - edadMinima, hoy.getMonth(), hoy.getDate());
    return nacimiento > fechaLimite ? { menorDeEdad: { edadMinima } } : null;
  };
}

/**
 * Validador ASÍNCRONO: le pregunta a la API si el correo / nombre de usuario está libre.
 * El timer(500) espera a que el usuario deje de tipear (si escribe de nuevo, Angular cancela
 * la consulta anterior y no se hacen requests por cada letra).
 */
export function disponibleValidator(
  usuarios: Usuarios,
  campo: 'correo' | 'nombreUsuario',
): AsyncValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) {
      return of(null);
    }
    return timer(500).pipe(
      switchMap(() => usuarios.disponible(campo, control.value)),
      map((disponible) => (disponible ? null : { enUso: true })),
      // Si la API no responde no bloqueamos el form: el back igual valida al registrar (409)
      catchError(() => of(null)),
    );
  };
}
