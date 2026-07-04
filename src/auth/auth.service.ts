import {
	BadRequestException,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'

import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import { MailService } from '../mail/mail.service'

import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { UpdatePasswordDto } from './dto/update.password.dto'
import { UpdateUsernameDto } from './dto/update.username.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private users: UsersService,
		private jwt: JwtService,
		private mail: MailService
	) {}

	async register(dto: RegisterDto) {
		if (dto.password !== dto.password_confirmation) {
			throw new BadRequestException({
				message: 'Validation error',
				errors: { password_confirmation: ['Passwords do not match'] }
			})
		}

		const existing = await this.users.findByEmail(dto.email)
		if (existing) {
			if (!existing.emailVerified) {
				await this.sendVerificationEmail(existing.id, existing.email)
				return { job_id: crypto.randomUUID() }
			}
			throw new BadRequestException({
				message: 'Validation error',
				errors: { email: ['Email is already taken'] }
			})
		}

		const passwordHash = await bcrypt.hash(dto.password, 10)
		const user = await this.users.create({
			email: dto.email,
			username: dto.username,
			passwordHash,
			newsletter: dto.mailing_enabled ?? false,
			emailVerified: false
		})

		await this.sendVerificationEmail(user.id, user.email)

		return { job_id: crypto.randomUUID() }
	}

	async verifyEmail(token: string) {
		const record = await this.prisma.emailVerificationToken.findUnique({
			where: { token }
		})

		if (!record || record.expiresAt < new Date()) {
			throw new BadRequestException('Invalid or expired verification token')
		}

		await this.prisma.user.update({
			where: { id: record.userId },
			data: { emailVerified: true }
		})

		await this.prisma.emailVerificationToken.delete({ where: { token } })
	}

	async resendVerification(email: string) {
		const user = await this.users.findByEmail(email)
		if (!user || user.emailVerified) return

		await this.sendVerificationEmail(user.id, user.email)
	}

	private async sendVerificationEmail(userId: string, email: string) {
		await this.prisma.emailVerificationToken.deleteMany({ where: { userId } })

		const token = crypto.randomUUID()
		await this.prisma.emailVerificationToken.create({
			data: {
				token,
				userId,
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа
			}
		})

		const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'
		const verifyUrl = `${frontendUrl}/email-confirmation?token=${token}`
		await this.mail.sendEmailVerification(email, verifyUrl)
	}

	async login(dto: LoginDto) {
		const user =
			(await this.users.findByEmail(dto.email)) ??
			(await this.users.findByUsername(dto.email))
		if (!user || !user.passwordHash)
			throw new UnauthorizedException('Invalid credentials')

		const match = await bcrypt.compare(dto.password, user.passwordHash)
		if (!match) throw new UnauthorizedException('Invalid credentials')

		const accessToken = this.jwt.sign({ sub: user.id, email: user.email })

		const refreshToken = crypto.randomUUID()
		await this.prisma.session.create({
			data: {
				userId: user.id,
				refreshToken,
				expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
			}
		})

		return {
			access_token: accessToken,
			email_is_verified: user.emailVerified,
			refreshToken
		}
	}
	async logout(refreshToken: string) {
		const session = await this.prisma.session.findUnique({
			where: { refreshToken },
			include: { user: true }
		})
		// Гостевой демо-аккаунт удаляем целиком при выходе (колоды/сессии — каскадом)
		if (session?.user && session.user.email.endsWith('@guest.langcards')) {
			await this.users.deleteById(session.user.id)
			return
		}
		await this.prisma.session.deleteMany({ where: { refreshToken } })
	}

	// Logout по access-токену (когда refresh-куки нет — запросы идут через
	// server actions). Гостя удаляем целиком, обычному юзеру чистим сессии.
	async logoutByAccessToken(accessToken: string) {
		let payload: { sub: string; email: string }
		try {
			payload = this.jwt.verify(accessToken)
		} catch {
			return // истёкший/битый токен — выходить и так не из чего
		}

		if (payload.email?.endsWith('@guest.langcards')) {
			await this.users.deleteById(payload.sub)
			return
		}
		await this.prisma.session.deleteMany({ where: { userId: payload.sub } })
	}

	// Гостевой демо-вход: создаёт временного юзера, при logout он удаляется
	async demoLogin() {
		const user = await this.prisma.user.create({
			data: {
				email: `demo-${crypto.randomUUID()}@guest.langcards`,
				username: `Gast-${crypto.randomUUID().slice(0, 8)}`,
				emailVerified: true,
				newsletter: false
			}
		})
		return this.loginUser({
			id: user.id,
			email: user.email,
			emailVerified: user.emailVerified
		})
	}

	async refresh(refreshToken: string) {
		const session = await this.prisma.session.findUnique({
			where: { refreshToken },
			include: { user: true }
		})

		if (!session || session.expiresAt < new Date()) {
			throw new UnauthorizedException('Invalid or expired refresh token')
		}

		const accessToken = this.jwt.sign({
			sub: session.user.id,
			email: session.user.email
		})
		return { access_token: accessToken }
	}

	async loginUser(user: {
		id: string
		email: string
		emailVerified: boolean
	}) {
		const accessToken = this.jwt.sign({ sub: user.id, email: user.email })
		const refreshToken = crypto.randomUUID()
		await this.prisma.session.create({
			data: {
				userId: user.id,
				refreshToken,
				expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
			}
		})
		return { access_token: accessToken, refreshToken }
	}

	async getProfile(userId: string) {
		const user = await this.users.findById(userId)
		if (!user) throw new UnauthorizedException('User not found')
		return {
			id: user.id,
			email: user.email,
			username: user.username,
			avatarUrl: user.avatarUrl ?? null,
			createdAt: user.createdAt
		}
	}

	async findOrCreateGoogleUser(data: {
		googleId: string
		email: string
		username: string
	}) {
		let user = await this.prisma.user.findUnique({
			where: { googleId: data.googleId }
		})

		if (!user) {
			user = await this.prisma.user.findUnique({
				where: { email: data.email }
			})
			if (user) {
				if (user.passwordHash) {
					return {
						conflict: true as const,
						googleId: data.googleId,
						email: user.email,
						username: user.username,
						avatarUrl: user.avatarUrl
					}
				}
				user = await this.prisma.user.update({
					where: { id: user.id },
					data: { googleId: data.googleId, emailVerified: true }
				})
			} else {
				user = await this.prisma.user.create({
					data: {
						googleId: data.googleId,
						email: data.email,
						username: await this.resolveUniqueUsername(data.username),
						emailVerified: true,
						newsletter: false
					}
				})
			}
		}

		return { conflict: false as const, user }
	}

	createPendingLinkToken(data: {
		googleId: string
		email: string
		username: string
		avatarUrl: string | null
	}): string {
		return this.jwt.sign(
			{ googleId: data.googleId, email: data.email, username: data.username, avatarUrl: data.avatarUrl, type: 'pending_link' },
			{ expiresIn: '5m' }
		)
	}

	async linkGoogleAccount(pendingToken: string, password: string) {
		let payload: any
		try {
			payload = this.jwt.verify(pendingToken)
		} catch {
			throw new BadRequestException('Invalid or expired token')
		}

		if (payload.type !== 'pending_link') {
			throw new BadRequestException('Invalid token type')
		}

		const user = await this.users.findByEmail(payload.email)
		if (!user || !user.passwordHash) {
			throw new BadRequestException('Account not found')
		}

		const match = await bcrypt.compare(password, user.passwordHash)
		if (!match) {
			throw new UnauthorizedException('Invalid password')
		}

		await this.prisma.user.update({
			where: { id: user.id },
			data: { googleId: payload.googleId, emailVerified: true }
		})

		return this.loginUser(user)
	}

	async updateUsername(userId: string, dto: UpdateUsernameDto) {
		const existing = await this.prisma.user.findUnique({
			where: { username: dto.username }
		})
		if (existing && existing.id !== userId) {
			throw new BadRequestException({
				message: 'Validation error',
				errors: { username: ['Username is already taken'] }
			})
		}
		return this.users.updateUsername(userId, dto.username)
	}

	async updateAvatar(userId: string, avatarUrl: string) {
		return this.users.updateAvatar(userId, avatarUrl)
	}

	async deleteAccount(userId: string) {
		await this.users.deleteById(userId)
	}

	async updatePassword(userId: string, dto: UpdatePasswordDto) {
		if (dto.password !== dto.password_confirmation) {
			throw new BadRequestException({
				message: 'Validation error',
				errors: { password_confirmation: ['Passwords do not match'] }
			})
		}
		const passwordHash = await bcrypt.hash(dto.password, 10)
		await this.prisma.user.update({
			where: { id: userId },
			data: { passwordHash }
		})
	}

	async forgotPassword(email: string) {
		const user = await this.users.findByEmail(email)
		if (!user) return // не раскрываем существование аккаунта

		await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

		const token = crypto.randomUUID()
		await this.prisma.passwordResetToken.create({
			data: {
				token,
				userId: user.id,
				expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 час
			}
		})

		const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'
		const resetUrl = `${frontendUrl}/password-change?token=${token}`
		await this.mail.sendPasswordReset(user.email, resetUrl)
	}

	async resetPassword(dto: ResetPasswordDto) {
		if (dto.password !== dto.password_confirmation) {
			throw new BadRequestException({
				message: 'Validation error',
				errors: { password_confirmation: ['Passwords do not match'] }
			})
		}

		const record = await this.prisma.passwordResetToken.findUnique({
			where: { token: dto.token }
		})

		if (!record || record.expiresAt < new Date()) {
			throw new BadRequestException('Invalid or expired reset token')
		}

		const passwordHash = await bcrypt.hash(dto.password, 10)
		await this.prisma.user.update({
			where: { id: record.userId },
			data: { passwordHash }
		})

		await this.prisma.passwordResetToken.delete({ where: { token: dto.token } })
	}

	private async resolveUniqueUsername(base: string): Promise<string> {
		const sanitized = base.replace(/\s+/g, '_').slice(0, 20)
		const existing = await this.prisma.user.findUnique({
			where: { username: sanitized }
		})
		if (!existing) return sanitized
		return `${sanitized}_${Math.random().toString(36).slice(2, 7)}`
	}
}
