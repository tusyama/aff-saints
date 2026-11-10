import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { requiredEnv } from '../common/env'
import { SESSION_MAX_AGE_SECONDS } from '../common/session'
import { AuthController } from './auth.controller'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'

@Module({
  imports: [
    JwtModule.register({
      secret: requiredEnv('JWT_SECRET'),
      signOptions: { expiresIn: SESSION_MAX_AGE_SECONDS },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
