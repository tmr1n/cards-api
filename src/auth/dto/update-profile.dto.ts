import { IsOptional, IsString, Matches, MinLength } from 'class-validator'

export class UpdateProfileDto {
	@IsString()
	@MinLength(3)
	@Matches(/^[A-Za-z]/, { message: 'Must start with a letter' })
	@Matches(/^[A-Za-z0-9_-]+$/, { message: 'Only letters, numbers, _ and -' })
	@IsOptional()
	username?: string

	// Nur eigene Preset-Avatare (/avatars/N.svg) oder von UploadThing gehostete
	// Bilder zulassen — keine beliebigen externen URLs (Tracking/kaputte Bilder).
	@IsString()
	@Matches(
		/^\/avatars\/[0-9]+\.svg$|^https:\/\/([a-z0-9-]+\.)?ufs\.sh\/|^https:\/\/utfs\.io\//,
		{ message: 'Invalid avatar URL' }
	)
	@IsOptional()
	avatarUrl?: string
}
