import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AuthModule } from './auth/auth.module'
import { CardsModule } from './cards/cards.module'
import { DecksModule } from './decks/decks.module'
import { PrismaModule } from './prisma/prisma.module'
import { UsersModule } from './users/user.module'

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		PrismaModule,
		UsersModule,
		AuthModule,
		DecksModule,
		CardsModule
	]
})
export class AppModule {}
