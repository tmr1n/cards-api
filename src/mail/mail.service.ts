import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'

@Injectable()
export class MailService {
	private resend: Resend
	private readonly logger = new Logger(MailService.name)

	private devEmail: string | undefined

	constructor(private config: ConfigService) {
		this.resend = new Resend(this.config.getOrThrow('RESEND_API_KEY'))
		this.devEmail = this.config.get<string>('DEV_EMAIL')
	}

	private resolveRecipient(email: string): string {
		return this.devEmail ?? email
	}

	async sendEmailVerification(email: string, verifyUrl: string) {
		const { error } = await this.resend.emails.send({
			from: 'LangCards <onboarding@resend.dev>',
			to: this.resolveRecipient(email),
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

		if (error) {
			this.logger.error('sendEmailVerification failed', error)
			throw new InternalServerErrorException('Failed to send verification email')
		}
	}

	async sendPasswordReset(email: string, resetUrl: string) {
		const { error } = await this.resend.emails.send({
			from: 'LangCards <onboarding@resend.dev>',
			to: this.resolveRecipient(email),
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

		if (error) {
			this.logger.error('sendPasswordReset failed', error)
			throw new InternalServerErrorException('Failed to send reset email')
		}
	}
}
