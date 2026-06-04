import {
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

import { CreateDeckDto } from './dto/create-deck.dto'
import { UpdateDeckDto } from './dto/update-deck.dto'

@Injectable()
export class DecksService {
	constructor(private prisma: PrismaService) {}

	findAll(userId: string) {
		return this.prisma.deck.findMany({
			where: { userId },
			include: { _count: { select: { cards: true } } },
			orderBy: { createdAt: 'desc' }
		})
	}

	async findOne(id: string, userId: string) {
		const deck = await this.prisma.deck.findUnique({
			where: { id },
			include: { cards: true }
		})
		if (!deck) throw new NotFoundException('Deck not found')
		if (deck.userId !== userId) throw new ForbiddenException()
		return deck
	}

	create(userId: string, dto: CreateDeckDto) {
		return this.prisma.deck.create({
			data: { ...dto, userId }
		})
	}

	async update(id: string, userId: string, dto: UpdateDeckDto) {
		await this.findOne(id, userId)
		return this.prisma.deck.update({ where: { id }, data: dto })
	}

	async remove(id: string, userId: string) {
		await this.findOne(id, userId)
		return this.prisma.deck.delete({ where: { id } })
	}
}
