import { IsOptional, Matches } from 'class-validator';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Query params de las estadísticas: ?desde=2026-11-01&hasta=2026-11-10 (el "lapso de tiempo"
 * que pide la consigna). Son DÍAS en hora argentina, los dos incluidos.
 * Si no vienen: los últimos 30 días hasta hoy. Que desde <= hasta lo valida el service.
 */
export class RangoFechasDto {
  @IsOptional()
  @Matches(FECHA, { message: 'desde tiene que ser una fecha AAAA-MM-DD' })
  desde?: string;

  @IsOptional()
  @Matches(FECHA, { message: 'hasta tiene que ser una fecha AAAA-MM-DD' })
  hasta?: string;
}
