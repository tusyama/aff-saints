import 'reflect-metadata'
import { ValidationPipe, type INestApplication, type ValidationError } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DomainError } from './common/domain-error'
import { requiredEnv } from './common/env'
import { DomainExceptionFilter } from './common/exception.filter'

export async function createApp(options?: { logger?: false }): Promise<INestApplication> {
  requiredEnv('DATABASE_URL')
  requiredEnv('JWT_SECRET')
  const app = await NestFactory.create(AppModule, options?.logger === false ? { logger: false } : undefined)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => new DomainError('VALIDATION', fieldsOf(errors)),
    }),
  )
  app.useGlobalFilters(new DomainExceptionFilter())
  return app
}

function fieldsOf(errors: ValidationError[]): string[] {
  const names: string[] = []
  for (const error of errors) {
    if (error.constraints) names.push(error.property)
    if (error.children?.length) names.push(...fieldsOf(error.children))
  }
  return [...new Set(names)]
}
