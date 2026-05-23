// UsersModule отвечает за всё что связано с пользователями в БД. AuthService будет использовать его чтобы найти пользователя при логине или создать нового при регистрации.
import { Module } from '@nestjs/common'

import { UsersService } from './users.service'

@Module({
	providers: [UsersService],
	exports: [UsersService]
})
export class UsersModule {}
