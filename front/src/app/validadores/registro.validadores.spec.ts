import { FormControl } from '@angular/forms';
import {
  correoValidator,
  edadMinimaValidator,
  sinSoloEspaciosValidator,
} from './registro.validadores';

describe('correoValidator', () => {
  const validar = (valor: string) => new FormControl(valor, correoValidator()).errors;

  it('rechaza un correo sin extensión después del dominio', () => {
    expect(validar('enrumontes@gmail')).toEqual({ correoInvalido: true });
    expect(validar('enrumontes@')).toEqual({ correoInvalido: true });
    expect(validar('enrumontes@gmail.')).toEqual({ correoInvalido: true });
    expect(validar('enrumontes@gmail.c')).toEqual({ correoInvalido: true });
  });

  it('acepta correos con dominio completo', () => {
    expect(validar('enrumontes@gmail.com')).toBeNull();
    expect(validar('hincha@fra.utn.edu.ar')).toBeNull();
  });

  it('deja el vacío para Validators.required', () => {
    expect(validar('')).toBeNull();
  });
});

describe('sinSoloEspaciosValidator (auditoría)', () => {
  const validar = (valor: string) => new FormControl(valor, sinSoloEspaciosValidator()).errors;

  it('marca como obligatorio un texto de solo espacios', () => {
    expect(validar('   ')).toEqual({ required: true });
    expect(validar('\n\t ')).toEqual({ required: true });
  });

  it('acepta texto real (y deja el vacío para Validators.required)', () => {
    expect(validar('  Hola ')).toBeNull();
    expect(validar('')).toBeNull();
  });
});

describe('edadMinimaValidator (auditoría)', () => {
  const validar = (valor: string) => new FormControl(valor, edadMinimaValidator(13)).errors;

  it('rechaza una fecha de hace más de 100 años', () => {
    expect(validar('1850-01-01')).toEqual({ demasiadoVieja: { edadMaxima: 100 } });
    expect(validar(`${new Date().getFullYear() - 101}-01-01`)).toEqual({
      demasiadoVieja: { edadMaxima: 100 },
    });
  });

  it('acepta a alguien de 99 años', () => {
    expect(validar(`${new Date().getFullYear() - 99}-01-01`)).toBeNull();
  });

  it('sigue aceptando una edad normal y rechazando a un menor', () => {
    expect(validar('1995-06-15')).toBeNull();
    expect(validar(`${new Date().getFullYear() - 5}-01-01`)).toEqual({
      menorDeEdad: { edadMinima: 13 },
    });
  });
});
