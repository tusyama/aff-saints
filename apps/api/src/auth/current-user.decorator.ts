import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { DomainError } from '../common/domain-error'
import type { PublicUser } from './auth.types'
import type { RequestWithUser } from './auth.guard'

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): PublicUser => {
  const request = context.switchToHttp().getRequest<RequestWithUser>()
  if (!request.user) throw new DomainError('UNAUTHENTICATED')
  return request.user
})
