import { IsString } from 'class-validator'

export class LinkGoogleDto {
	@IsString()
	token!: string

	@IsString()
	password!: string
}
