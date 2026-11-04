import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const ORDENES = ['fecha', 'meGusta'] as const;

// Query params de GET /publicaciones. Todo llega como texto: @Type(() => Number) lo convierte.
export class ListarPublicacionesDto {
  @IsOptional()
  @IsIn(ORDENES, { message: 'El orden tiene que ser "fecha" o "meGusta"' })
  orden: (typeof ORDENES)[number] = 'fecha';

  // offset: cuántas saltear (página 2 con limit 10 -> offset 10)
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset tiene que ser un número entero' })
  @Min(0, { message: 'offset no puede ser negativo' })
  offset: number = 0;

  // limit: cuántas traer como máximo
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit tiene que ser un número entero' })
  @Min(1, { message: 'limit tiene que ser al menos 1' })
  @Max(50, { message: 'limit no puede ser mayor a 50' })
  limit: number = 10;

  // Filtro: solo las de un usuario (lo usa Mi perfil para sus últimas 3)
  @IsOptional()
  @IsMongoId({ message: 'El usuario no es válido' })
  usuario?: string;

  // Filtro: solo las de un partido (página del partido)
  @IsOptional()
  @IsString()
  partido?: string;
}
