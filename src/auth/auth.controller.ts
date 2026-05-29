import {
	Body,
	Controller,
	Delete,
	Get,
	Patch,
	Post,
	Req,
	Res,
	UnauthorizedException,
	UseGuards
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request, Response } from 'express'

import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { UpdatePasswordDto } from './dto/update.password.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { VerifyEmailDto } from './dto/verify-email.dto'
import { ResendVerificationDto } from './dto/resend-verification.dto'

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

	@Get('profile')
	@UseGuards(AuthGuard('jwt'))
	async getProfile(@Req() req: Request) {
		const user = req.user as { id: string; email: string }
		const data = await this.auth.getProfile(user.id)
		return { success: true, message: 'OK', data }
	}

	// В AuthController
	@Get('google')
	@UseGuards(AuthGuard('google'))
	googleAuth() {}

	@Get('google/callback')
	@UseGuards(AuthGuard('google'))
	async googleCallback(@Req() req: Request, @Res() res: Response) {
		const tokens = await this.auth.loginUser(req.user as any)
		res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS)
		res.redirect(
			`${process.env.FRONTEND_URL}/auth/callback?token=${tokens.access_token}`
		)
	}

	@Patch('profile')
	@UseGuards(AuthGuard('jwt'))
	async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
		const user = req.user as { id: string; email: string }
		if (dto.username) await this.auth.updateUsername(user.id, { username: dto.username })
		if (dto.avatarUrl !== undefined) await this.auth.updateAvatar(user.id, dto.avatarUrl)
		return { success: true, message: 'Profile updated', data: null }
	}
	@Post('updatePassword')
	@UseGuards(AuthGuard('jwt'))
	async updatePassword(@Req() req: Request, @Body() dto: UpdatePasswordDto) {
		const user = req.user as { id: string; email: string }
		await this.auth.updatePassword(user.id, dto)
		return { success: true, message: 'Password updated', data: null }
	}

	@Delete('profile')
	@UseGuards(AuthGuard('jwt'))
	async deleteAccount(@Req() req: Request) {
		const user = req.user as { id: string; email: string }
		await this.auth.deleteAccount(user.id)
		return { success: true, message: 'Account deleted', data: null }
	}

	@Post('forgot-password')
	async forgotPassword(@Body() dto: ForgotPasswordDto) {
		await this.auth.forgotPassword(dto.email)
		return { success: true, message: 'Reset link sent', data: null }
	}

	@Post('reset-password')
	async resetPassword(@Body() dto: ResetPasswordDto) {
		await this.auth.resetPassword(dto)
		return { success: true, message: 'Password reset', data: null }
	}

	@Post('verify-email')
	async verifyEmail(@Body() dto: VerifyEmailDto) {
		await this.auth.verifyEmail(dto.token)
		return { success: true, message: 'Email verified', data: null }
	}

	@Post('resend-verification')
	async resendVerification(@Body() dto: ResendVerificationDto) {
		await this.auth.resendVerification(dto.email)
		return { success: true, message: 'Verification email sent', data: null }
	}
}
