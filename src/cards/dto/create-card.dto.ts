import { IsString, MinLength } from 'class-validator'

export class CreateCardDto {
	@IsString()
	@MinLength(1)
	front: string

	@IsString()
	@MinLength(1)
	back: string
}
