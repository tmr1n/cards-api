import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request } from 'express'

import { DecksService } from './decks.service'
import { CreateDeckDto } from './dto/create-deck.dto'
import { QueryDecksDto } from './dto/query-decks.dto'
import { UpdateDeckDto } from './dto/update-deck.dto'

@UseGuards(AuthGuard('jwt'))
@Controller('decks')
export class DecksController {
	constructor(private decksService: DecksService) {}

	@Get()
	async findAll(@Query() query: QueryDecksDto, @Req() req: Request) {
		const user = req.user as { id: string }
		const result = await this.decksService.findAll(user.id, query)
		return {
			success: true,
			message: 'OK',
			data: result.data,
			meta: {
				total: result.total,
				page: result.page,
				limit: result.limit,
				totalPages: Math.max(1, Math.ceil(result.total / result.limit))
			}
		}
	}

	@Get(':id')
	async findOne(@Param('id') id: string, @Req() req: Request) {
		const user = req.user as { id: string }
		const data = await this.decksService.findOne(id, user.id)
		return { success: true, message: 'OK', data }
	}

	@Post()
	async create(@Body() dto: CreateDeckDto, @Req() req: Request) {
		const user = req.user as { id: string }
		const data = await this.decksService.create(user.id, dto)
		return { success: true, message: 'Deck created', data }
	}

	@Patch(':id')
	async update(@Param('id') id: string, @Body() dto: UpdateDeckDto, @Req() req: Request) {
		const user = req.user as { id: string }
		const data = await this.decksService.update(id, user.id, dto)
		return { success: true, message: 'Deck updated', data }
	}

	@Delete(':id')
	async remove(@Param('id') id: string, @Req() req: Request) {
		const user = req.user as { id: string }
		await this.decksService.remove(id, user.id)
		return { success: true, message: 'Deck deleted', data: null }
	}
}
