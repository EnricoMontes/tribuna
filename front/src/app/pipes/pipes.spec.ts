import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InicialesPipe } from './iniciales.pipe';
import { PluralPipe } from './plural.pipe';
import { TiempoRelativoPipe } from './tiempo-relativo.pipe';

describe('InicialesPipe', () => {
  const pipe = new InicialesPipe();

  it('devuelve la primera letra del nombre y del apellido, en mayúscula', () => {
    expect(pipe.transform({ nombre: 'enrico', apellido: 'montes' })).toBe('EM');
  });

  it('ignora espacios y datos que faltan', () => {
    expect(pipe.transform({ nombre: '  Lucía ', apellido: '' })).toBe('L');
    expect(pipe.transform(null)).toBe('');
  });
});

describe('PluralPipe', () => {
  const pipe = new PluralPipe();

  it('usa el singular solo con 1', () => {
    expect(pipe.transform(1, 'comentario')).toBe('1 comentario');
    expect(pipe.transform(0, 'comentario')).toBe('0 comentarios');
    expect(pipe.transform(12, 'comentario')).toBe('12 comentarios');
  });

  it('acepta un plural irregular', () => {
    expect(pipe.transform(3, 'publicación', 'publicaciones')).toBe('3 publicaciones');
  });
});

describe('TiempoRelativoPipe', () => {
  let pipe: TiempoRelativoPipe;
  const hace = (ms: number) => new Date(Date.now() - ms);
  const MIN = 60 * 1000;

  beforeEach(() => {
    registerLocaleData(localeEsAr);
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'es-AR' }] });
    // el pipe usa inject(LOCALE_ID): se crea dentro del inyector del test
    pipe = TestBed.runInInjectionContext(() => new TiempoRelativoPipe());
  });

  it('dice "recién" y los minutos', () => {
    expect(pipe.transform(hace(10 * 1000))).toBe('recién');
    expect(pipe.transform(hace(5 * MIN))).toBe('hace 5 min');
  });

  it('con una semana o más muestra la fecha corta', () => {
    expect(pipe.transform('2025-03-07T15:00:00-03:00')).toBe('7 mar 2025');
  });

  it('sin fecha devuelve vacío', () => {
    expect(pipe.transform(null)).toBe('');
  });
});
