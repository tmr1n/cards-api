import { IsString, MaxLength, MinLength } from 'class-validator'

export class CreateCardDto {
	@IsString()
	@MinLength(1)
	@MaxLength(35)
	front: string

	@IsString()
	@MinLength(1)
	@MaxLength(35)
	back: string
}
