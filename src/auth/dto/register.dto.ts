import {
	IsBoolean,
	IsEmail,
	IsOptional,
	IsString,
	MinLength
} from 'class-validator'

export class RegisterDto {
	@IsEmail()
	email!: string

	@IsString()
	@MinLength(3)
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
