import { Module } from '@nestjs/common'

import { PrismaModule } from '../prisma/prisma.module'

import { CardsController } from './cards.controller'
import { CardsService } from './cards.service'

@Module({
	imports: [PrismaModule],
	controllers: [CardsController],
	providers: [CardsService]
})
export class CardsModule {}
