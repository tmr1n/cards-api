import { IsString, MinLength } from 'class-validator'

export class UpdatePasswordDto {
	@IsString()
	@MinLength(8)
	password!: string

	@IsString()
	password_confirmation!: string
}
