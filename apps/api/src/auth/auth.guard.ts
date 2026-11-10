import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import type { Request } from 'express'
import { DomainError } from '../common/domain-error'
import { AuthService } from './auth.service'
import type { PublicUser } from './auth.types'

export type RequestWithUser = Request & { user?: PublicUser }

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const user = await this.auth.userFromRequest(request)
    if (!user) throw new DomainError('UNAUTHENTICATED')
    request.user = user
    return true
  }
}
