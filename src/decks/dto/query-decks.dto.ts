import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

// Валидация query-параметров списка колод: ?page=&limit=&search=
// Query-параметры всегда приходят строками — @Type(() => Number) приводит их к числу
// (работает только при transform: true в глобальном ValidationPipe).
export class QueryDecksDto {
	// Номер страницы, с 1. Если не передан — 1.
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page: number = 1

	// Размер страницы. Max 100 — защита: нельзя попросить миллион записей за раз.
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit: number = 20

	// Поисковый запрос по названию колоды (необязательный).
	@IsOptional()
	@IsString()
	@MaxLength(100)
	search?: string
}
