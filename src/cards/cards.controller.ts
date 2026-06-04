import {
	Body,
	Controller,
	Delete,
	Param,
	Patch,
	Post,
	Req,
	UseGuards
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request } from 'express'

import { CardsService } from './cards.service'
import { CreateCardDto } from './dto/create-card.dto'
import { UpdateCardDto } from './dto/update-card.dto'

@UseGuards(AuthGuard('jwt'))
@Controller()
export class CardsController {
	constructor(private cardsService: CardsService) {}

	@Post('decks/:deckId/cards')
	async create(
		@Param('deckId') deckId: string,
		@Body() dto: CreateCardDto,
		@Req() req: Request
	) {
		const user = req.user as { id: string }
		const data = await this.cardsService.create(deckId, user.id, dto)
		return { success: true, message: 'Card created', data }
	}

	@Patch('cards/:id')
	async update(
		@Param('id') id: string,
		@Body() dto: UpdateCardDto,
		@Req() req: Request
	) {
		const user = req.user as { id: string }
		const data = await this.cardsService.update(id, user.id, dto)
		return { success: true, message: 'Card updated', data }
	}

	@Delete('cards/:id')
	async remove(@Param('id') id: string, @Req() req: Request) {
		const user = req.user as { id: string }
		await this.cardsService.remove(id, user.id)
		return { success: true, message: 'Card deleted', data: null }
	}
}
