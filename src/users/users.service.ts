import { Injectable } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}

	findByEmail(email: string) {
		return this.prisma.user.findUnique({ where: { email } })
	}

	findByUsername(username: string) {
		return this.prisma.user.findUnique({ where: { username } })
	}

	findById(id: string) {
		return this.prisma.user.findUnique({ where: { id } })
	}

	create(data: {
		email: string
		username: string
		passwordHash?: string
		newsletter: boolean
		emailVerified: boolean
	}) {
		return this.prisma.user.create({ data })
	}

	updateUsername(id: string, username: string) {
		return this.prisma.user.update({ where: { id }, data: { username } })
	}

	async deleteById(id: string) {
		await this.prisma.$transaction([
			this.prisma.card.deleteMany({ where: { deck: { userId: id } } }),
			this.prisma.deck.deleteMany({ where: { userId: id } }),
			this.prisma.session.deleteMany({ where: { userId: id } }),
			this.prisma.user.delete({ where: { id } })
		])
	}
}

// constructor(private prisma: PrismaService) — это Dependency Injection. NestJS сам создаст и подставит PrismaService, тебе не нужно делать new PrismaService()
// @Injectable() — декоратор, который говорит NestJS: "этот класс можно инжектить в другие классы"
// Методы просто обращаются к таблице user через Prisma — она сгенерировала их автоматически из schema.prisma
//DI - это способ, которым NestJS управляет зависимостями между классами. Вместо того, чтобы создавать экземпляры классов вручную (например, new PrismaService()), ты говоришь NestJS, что тебе нужен этот сервис, и он сам его создаёт и передаёт тебе. Это упрощает тестирование и делает код более модульным.
