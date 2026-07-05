import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	constructor(config: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: config.getOrThrow('JWT_SECRET')
		})
	}

	validate(payload: { sub: string; email: string; type?: string }) {
		// Nur echte Access-Tokens zulassen. Spezialtokens (z. B. der 5-min
		// "pending_link"-Token) sind mit demselben Secret signiert, dürfen aber
		// keinen Zugriff auf geschützte Routen gewähren.
		if (payload.type) throw new UnauthorizedException()
		return { id: payload.sub, email: payload.email }
	}
}
