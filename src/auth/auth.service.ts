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
			newsletter: dto.mailing_enabled ?? false
		})

		return { job_id: crypto.randomUUID() } // Placeholder for async job ID to send welcome email, etc.
	}

	async login(dto: LoginDto) {
		const user = await this.users.findByEmail(dto.email)
		if (!user) throw new UnauthorizedException('Invalid credentials')

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
}
