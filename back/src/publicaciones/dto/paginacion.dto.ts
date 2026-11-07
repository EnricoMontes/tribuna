import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Query params ?offset=&limit= del GET de comentarios
export class PaginacionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset tiene que ser un número entero' })
  @Min(0, { message: 'offset no puede ser negativo' })
  offset: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit tiene que ser un número entero' })
  @Min(1, { message: 'limit tiene que ser al menos 1' })
  @Max(50, { message: 'limit no puede ser mayor a 50' })
  limit: number = 5;
}
