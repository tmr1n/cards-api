import {
	Injectable,
	InternalServerErrorException,
	Logger
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

interface MailLayoutOptions {
	heading: string
	intro: string
	buttonLabel: string
	buttonUrl: string
	note: string
	footer: string
}

@Injectable()
export class MailService {
	private transporter: Transporter
	private readonly from: string
	private readonly logger = new Logger(MailService.name)

	constructor(private config: ConfigService) {
		this.transporter = nodemailer.createTransport({
			host: this.config.getOrThrow<string>('SMTP_HOST'),
			port: Number(this.config.getOrThrow<string>('SMTP_PORT')),
			// Mailpit (dev) runs without TLS; in prod use secure=true + auth
			secure: false
		})

		this.from =
			this.config.get<string>('MAIL_FROM') ??
			'LangCards <noreply@langcards.local>'
	}

	async sendEmailVerification(email: string, verifyUrl: string) {
		const html = this.layout({
			heading: 'Bestätige deine E-Mail-Adresse',
			intro: 'Willkommen bei LangCards! Klicke auf den Button, um deine E-Mail-Adresse zu bestätigen und loszulegen.',
			buttonLabel: 'E-Mail bestätigen',
			buttonUrl: verifyUrl,
			note: 'Dieser Link ist 24 Stunden gültig.',
			footer: 'Wenn du dich nicht bei LangCards registriert hast, kannst du diese E-Mail einfach ignorieren.'
		})

		await this.send(
			email,
			'Bestätige deine E-Mail-Adresse — LangCards',
			html,
			'sendEmailVerification'
		)
	}

	async sendPasswordReset(email: string, resetUrl: string) {
		const html = this.layout({
			heading: 'Passwort zurücksetzen',
			intro: 'Du hast angefordert, das Passwort für dein LangCards-Konto zurückzusetzen. Klicke auf den Button, um ein neues Passwort festzulegen.',
			buttonLabel: 'Neues Passwort festlegen',
			buttonUrl: resetUrl,
			note: 'Dieser Link ist 1 Stunde gültig.',
			footer: 'Wenn du kein neues Passwort angefordert hast, kannst du diese E-Mail einfach ignorieren.'
		})

		await this.send(
			email,
			'Passwort zurücksetzen — LangCards',
			html,
			'sendPasswordReset'
		)
	}

	private async send(
		to: string,
		subject: string,
		html: string,
		context: string
	) {
		try {
			await this.transporter.sendMail({ from: this.from, to, subject, html })
		} catch (err) {
			this.logger.error(`${context} failed`, err)
			throw new InternalServerErrorException('Failed to send email')
		}
	}

	// Shared, email-client-safe layout (inline styles, max-width card)
	private layout(opts: MailLayoutOptions): string {
		return `
		<div style="background:#f4f4f5;padding:32px 16px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
			<div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
				<div style="background:#2563eb;padding:20px 32px;">
					<span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">LangCards</span>
				</div>
				<div style="padding:32px;">
					<h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">${opts.heading}</h1>
					<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3f3f46;">${opts.intro}</p>
					<a href="${opts.buttonUrl}" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">${opts.buttonLabel}</a>
					<p style="margin:24px 0 0;font-size:13px;color:#71717a;">${opts.note}</p>
					<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#a1a1aa;word-break:break-all;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br /><a href="${opts.buttonUrl}" style="color:#2563eb;">${opts.buttonUrl}</a></p>
				</div>
				<div style="padding:16px 32px;border-top:1px solid #e4e4e7;">
					<p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;">${opts.footer}</p>
				</div>
			</div>
		</div>
		`
	}
}
