import { IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class UpdateUsernameDto {
	@IsString()
	@MinLength(3)
	@MaxLength(20)
	@Matches(/^[A-Za-z]/, { message: 'Must start with a letter' })
	@Matches(/^[A-Za-z0-9_-]+$/, { message: 'Only letters, numbers, _ and -' })
	username!: string
}
