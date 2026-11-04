import { FormControl } from '@angular/forms';
import { correoValidator } from './registro.validadores';

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
