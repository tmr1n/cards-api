import { Global, Module } from '@nestjs/common'

import { PrismaService } from './prisma.service'

@Global()
@Module({
	providers: [PrismaService], //регистрирует PrismaService внутри этого модуля
	exports: [PrismaService] //говорит NestJS: "другие модули, которые импортируют PrismaModule, получат PrismaService"
})
export class PrismaModule {}
