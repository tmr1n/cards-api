import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback } from 'passport-google-oauth20'

import { AuthService } from '../auth.service'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
	constructor(
		config: ConfigService,
		private auth: AuthService
	) {
		super({
			clientID: config.getOrThrow('GOOGLE_CLIENT_ID'),
			clientSecret: config.getOrThrow('GOOGLE_CLIENT_SECRET'),
			callbackURL: config.getOrThrow('GOOGLE_CALLBACK_URL'),
			scope: ['email', 'profile']
		})
	}

	async validate(
		accessToken: string,
		refreshToken: string,
		profile: any,
		done: VerifyCallback
	) {
		const user = await this.auth.findOrCreateGoogleUser({
			googleId: profile.id,
			email: profile.emails[0].value,
			username: profile.displayName
		})
		done(null, user)
	}
}
