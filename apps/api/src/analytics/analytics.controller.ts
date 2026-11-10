import { Controller, Get, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { PublicUser } from '../auth/auth.types'
import type { AnalyticsModel } from './analytics.model'
import { AnalyticsService } from './analytics.service'

@Controller('api')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('analytics')
  analytics(@CurrentUser() user: PublicUser): Promise<AnalyticsModel> {
    return this.analyticsService.overview(user)
  }
}
