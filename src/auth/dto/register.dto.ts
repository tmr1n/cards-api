import {
	IsBoolean,
	IsEmail,
	IsOptional,
	IsString,
	MaxLength,
	MinLength
} from 'class-validator'

export class RegisterDto {
	@IsEmail()
	email!: string

	@IsString()
	@MinLength(3)
	@MaxLength(20)
	username!: string

	@IsString()
	@MinLength(8)
	password!: string

	@IsString()
	password_confirmation!: string

	@IsBoolean()
	@IsOptional()
	mailing_enabled?: boolean

	@IsBoolean()
	terms_accepted!: boolean
}
