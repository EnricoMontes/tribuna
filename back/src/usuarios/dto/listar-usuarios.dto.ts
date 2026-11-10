import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const ESTADOS = [
  'todos',
  'habilitados',
  'deshabilitados',
  'administradores',
] as const;
export type Estado = (typeof ESTADOS)[number];

/**
 * Query params de GET /usuarios (dashboard del admin), paginado igual que las publicaciones:
 * ?offset=0&limit=10&estado=habilitados&buscar=juan
 * Todo llega como texto: @Type(() => Number) convierte offset y limit antes de validar.
 */
export class ListarUsuariosDto {
  // offset: cuántos saltear (página 2 con limit 10 -> offset 10)
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset tiene que ser un número entero' })
  @Min(0, { message: 'offset no puede ser negativo' })
  offset: number = 0;

  // limit: cuántos traer como máximo
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit tiene que ser un número entero' })
  @Min(1, { message: 'limit tiene que ser al menos 1' })
  @Max(50, { message: 'limit no puede ser mayor a 50' })
  limit: number = 10;

  // Filtro por estado o por perfil (los "chips" del dashboard)
  @IsOptional()
  @IsIn(ESTADOS, {
    message:
      'El estado tiene que ser "todos", "habilitados", "deshabilitados" o "administradores"',
  })
  estado: Estado = 'todos';

  // Búsqueda por nombre, apellido, nombre de usuario o correo
  @IsOptional()
  @IsString({ message: 'La búsqueda tiene que ser texto' })
  @MaxLength(50, { message: 'La búsqueda no puede superar los 50 caracteres' })
  buscar?: string;
}
