import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

import { CreateCardDto } from './dto/create-card.dto'
import { UpdateCardDto } from './dto/update-card.dto'

@Injectable()
export class CardsService {
	constructor(private prisma: PrismaService) {}

	async create(deckId: string, userId: string, dto: CreateCardDto) {
		await this.verifyDeckOwner(deckId, userId)
		return this.prisma.card.create({
			data: { ...dto, deckId }
		})
	}

	async update(id: string, userId: string, dto: UpdateCardDto) {
		await this.verifyCardOwner(id, userId)
		return this.prisma.card.update({ where: { id }, data: dto })
	}

	async remove(id: string, userId: string) {
		await this.verifyCardOwner(id, userId)
		return this.prisma.card.delete({ where: { id } })
	}

	private async verifyDeckOwner(deckId: string, userId: string) {
		const deck = await this.prisma.deck.findUnique({ where: { id: deckId } })
		if (!deck) throw new NotFoundException('Deck not found')
		if (deck.userId !== userId) throw new ForbiddenException()
	}

	private async verifyCardOwner(cardId: string, userId: string) {
		const card = await this.prisma.card.findUnique({
			where: { id: cardId },
			include: { deck: true }
		})
		if (!card) throw new NotFoundException('Card not found')
		if (card.deck.userId !== userId) throw new ForbiddenException()
	}
}
