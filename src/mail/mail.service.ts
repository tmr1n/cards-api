import {
	Injectable,
	InternalServerErrorException,
	Logger
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

@Injectable()
export class MailService {
	private transporter: Transporter
	private readonly from: string
	private readonly logger = new Logger(MailService.name)

	constructor(private config: ConfigService) {
		this.transporter = nodemailer.createTransport({
			host: this.config.getOrThrow<string>('SMTP_HOST'),
			port: Number(this.config.getOrThrow<string>('SMTP_PORT')),
			// Mailpit в dev слушает без TLS; в проде secure=true + auth
			secure: false
		})

		this.from =
			this.config.get<string>('MAIL_FROM') ??
			'LangCards <noreply@langcards.local>'
	}

	async sendEmailVerification(email: string, verifyUrl: string) {
		try {
			await this.transporter.sendMail({
				from: this.from,
				to: email,
				subject: 'Подтвердите email — LangCards',
				html: `
					<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
						<h2>Подтверждение email</h2>
						<p>Спасибо за регистрацию в LangCards! Нажмите кнопку ниже чтобы подтвердить ваш email.</p>
						<p>
							<a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
								Подтвердить email
							</a>
						</p>
						<p style="color:#6b7280;font-size:14px;">Ссылка действует 24 часа.</p>
						<p style="color:#6b7280;font-size:14px;">Если вы не регистрировались — просто проигнорируйте это письмо.</p>
					</div>
				`
			})
		} catch (err) {
			this.logger.error('sendEmailVerification failed', err)
			throw new InternalServerErrorException(
				'Failed to send verification email'
			)
		}
	}

	async sendPasswordReset(email: string, resetUrl: string) {
		try {
			await this.transporter.sendMail({
				from: this.from,
				to: email,
				subject: 'Сброс пароля — LangCards',
				html: `
					<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
						<h2>Сброс пароля</h2>
						<p>Вы запросили сброс пароля для вашего аккаунта LangCards.</p>
						<p>
							<a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
								Установить новый пароль
							</a>
						</p>
						<p style="color:#6b7280;font-size:14px;">Ссылка действует 1 час.</p>
						<p style="color:#6b7280;font-size:14px;">Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.</p>
					</div>
				`
			})
		} catch (err) {
			this.logger.error('sendPasswordReset failed', err)
			throw new InternalServerErrorException('Failed to send reset email')
		}
	}
}
