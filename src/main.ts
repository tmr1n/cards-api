import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'

import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	app.setGlobalPrefix('api/v1')
	app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
	app.use(cookieParser())
	// разрешённые origin'ы задаём через env (через запятую), fallback — локальный дев
	const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
		.split(',')
		.map(origin => origin.trim())
	app.enableCors({
		origin: corsOrigins,
		credentials: true
	})

	const swaggerConfig = new DocumentBuilder()
		.setTitle('LangCards API')
		.setDescription('API приложения карточек для изучения языков')
		.setVersion('1.0')
		// все роуты живут под глобальным префиксом — учитываем его в «Try it out»
		.addServer('/api/v1')
		// замочек для эндпоинтов под AuthGuard('jwt')
		.addBearerAuth()
		.build()
	const document = SwaggerModule.createDocument(app, swaggerConfig)
	SwaggerModule.setup('api/docs', app, document)

	await app.listen(3001)
}
bootstrap()
