import {
	Body,
	Controller,
	Post,
	Req,
	Res,
	UnauthorizedException
} from '@nestjs/common'
import type { Request, Response } from 'express'

import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

const REFRESH_COOKIE = 'refresh_token'
const COOKIE_OPTIONS = {
	httpOnly: true,
	sameSite: 'lax' as const,
	maxAge: 30 * 24 * 60 * 60 * 1000
}

@Controller()
export class AuthController {
	constructor(private auth: AuthService) {}

	@Post('registration')
	async register(@Body() dto: RegisterDto) {
		const data = await this.auth.register(dto)
		return { success: true, message: 'Registration successful', data }
	}

	@Post('login')
	async login(
		@Body() dto: LoginDto,
		@Res({ passthrough: true }) res: Response
	) {
		const { refreshToken, ...data } = await this.auth.login(dto)
		res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS)
		return { success: true, message: 'Login successful', data }
	}

	@Post('logout')
	async logout(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		const token = req.cookies?.[REFRESH_COOKIE]
		if (token) await this.auth.logout(token)
		res.clearCookie(REFRESH_COOKIE)
		return { success: true, message: 'Logged out', data: null }
	}

	@Post('refresh')
	async refresh(@Req() req: Request) {
		const token = req.cookies?.[REFRESH_COOKIE]
		if (!token) throw new UnauthorizedException('No refresh token')
		const data = await this.auth.refresh(token)
		return { success: true, message: 'Token refreshed', data }
	}
}
