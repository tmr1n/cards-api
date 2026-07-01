import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'

import { AuthModule } from './auth/auth.module'
import { CardsModule } from './cards/cards.module'
import { DecksModule } from './decks/decks.module'
import { PrismaModule } from './prisma/prisma.module'
import { UsersModule } from './users/user.module'

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		// глобальный лимит: 100 запросов за 60 сек с одного IP
		ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
		PrismaModule,
		UsersModule,
		AuthModule,
		DecksModule,
		CardsModule
	],
	// применяет throttler ко всем роутам; на чувствительных ужесточаем через @Throttle
	providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
})
export class AppModule {}
