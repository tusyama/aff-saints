import type { DomainCode } from './domain-error'

export function httpStatus(code: DomainCode): number {
  switch (code) {
    case 'UNAUTHENTICATED':
    case 'INVALID_CREDENTIALS':
      return 401
    case 'FORBIDDEN':
      return 403
    case 'NOT_FOUND':
      return 404
    case 'INVALID_TRANSITION':
    case 'TASK_ALREADY_CLAIMED':
      return 409
    case 'VALIDATION':
      return 400
    case 'INTERNAL':
      return 500
  }
}
