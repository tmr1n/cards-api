import {
	IsInt,
	IsOptional,
	IsString,
	MaxLength,
	Min,
	MinLength
} from 'class-validator'

export class CreateCardDto {
	@IsString()
	@MinLength(1)
	@MaxLength(35)
	front: string

	@IsString()
	@MinLength(1)
	@MaxLength(35)
	back: string

	// Позиция карточки в колоде (для сохранения порядка после drag-n-drop)
	@IsOptional()
	@IsInt()
	@Min(0)
	order?: number
}
