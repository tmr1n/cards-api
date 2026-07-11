import {
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'

import { CreateDeckDto } from './dto/create-deck.dto'
import { QueryDecksDto } from './dto/query-decks.dto'
import { UpdateDeckDto } from './dto/update-deck.dto'

@Injectable()
export class DecksService {
	constructor(private prisma: PrismaService) {}

	async findAll(userId: string, query: QueryDecksDto) {
		const { page, limit, search } = query

		// Фильтр: колоды пользователя + (если задан) поиск по названию.
		// mode: 'insensitive' — регистронезависимо (только PostgreSQL).
		const where: Prisma.DeckWhereInput = {
			userId,
			...(search ? { title: { contains: search, mode: 'insensitive' } } : {})
		}

		// Одна страница данных + общее число совпадений (для «Seite X von Y»).
		// $transaction — оба запроса на одном снимке данных.
		const [data, total] = await this.prisma.$transaction([
			this.prisma.deck.findMany({
				where,
				include: { _count: { select: { cards: true } } },
				orderBy: { createdAt: 'desc' },
				skip: (page - 1) * limit, // сколько пропустить: стр.1→0, стр.2→limit
				take: limit // сколько взять
			}),
			this.prisma.deck.count({ where })
		])

		return { data, total, page, limit }
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
		// В схеме нет onDelete: Cascade → сначала карточки, потом колода (атомарно)
		await this.prisma.$transaction([
			this.prisma.card.deleteMany({ where: { deckId: id } }),
			this.prisma.deck.delete({ where: { id } })
		])
	}
}
