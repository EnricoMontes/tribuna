import { Transform } from 'class-transformer';

/**
 * Decorador propio para los DTOs: le saca los espacios del principio y del final a un texto
 * ANTES de validarlo (class-transformer corre antes que class-validator en el ValidationPipe).
 *
 * Sin esto, "   " pasaba @IsNotEmpty (no es un texto vacío), pero el schema de Mongoose
 * tiene trim: true y lo dejaba en "" -> chocaba con required y la base tiraba un error que
 * salía como 500. Ahora "   " se convierte en "" y @IsNotEmpty responde 400 con su mensaje.
 *
 * Si no es un texto (por ejemplo un número o un array), lo deja igual para que lo rechace
 * el validador que corresponde (@IsString).
 */
export const Recortar = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
