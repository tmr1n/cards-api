import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateDeckDto {
	@IsString()
	@MinLength(1)
	@MaxLength(25)
	title: string

	@IsString()
	@IsOptional()
	@MaxLength(25)
	description?: string
}
