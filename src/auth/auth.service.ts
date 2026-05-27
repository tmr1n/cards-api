import {
	BadRequestException,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'

import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'

import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private users: UsersService,
		private jwt: JwtService
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
			throw new BadRequestException({
				message: 'Validation error',
				errors: { email: ['Email is already taken'] }
			})
		}

		const passwordHash = await bcrypt.hash(dto.password, 10)
		await this.users.create({
			email: dto.email,
			username: dto.username,
			passwordHash,
			newsletter: dto.mailing_enabled ?? false,
			emailVerified: true
		})

		return { job_id: crypto.randomUUID() } // Placeholder for async job ID to send welcome email, etc.
	}

	async login(dto: LoginDto) {
		const user = await this.users.findByEmail(dto.email)
		if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials')

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
		await this.prisma.session.deleteMany({ where: { refreshToken } })
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

	async loginUser(user: { id: string; email: string; emailVerified: boolean }) {
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
			createdAt: user.createdAt,
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
			user = await this.prisma.user.findUnique({ where: { email: data.email } })
			if (user) {
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

		return user
	}

	private async resolveUniqueUsername(base: string): Promise<string> {
		const sanitized = base.replace(/\s+/g, '_').slice(0, 20)
		const existing = await this.prisma.user.findUnique({ where: { username: sanitized } })
		if (!existing) return sanitized
		return `${sanitized}_${Math.random().toString(36).slice(2, 7)}`
	}
}
