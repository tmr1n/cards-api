import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	//когда модуль загрузится - вызови onModuleInit
	async onModuleInit() {
		await this.$connect() //подключаемся к базе данных
	}
}
