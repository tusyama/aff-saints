import { Module } from '@nestjs/common'
import { AnalyticsModule } from './analytics/analytics.module'
import { AuthModule } from './auth/auth.module'
import { HealthController } from './health.controller'
import { PrismaModule } from './prisma/prisma.module'
import { TasksModule } from './tasks/tasks.module'

@Module({
  imports: [PrismaModule, AuthModule, TasksModule, AnalyticsModule],
  controllers: [HealthController],
})
export class AppModule {}
