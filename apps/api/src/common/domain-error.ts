export const DOMAIN_CODES = [
  'UNAUTHENTICATED',
  'INVALID_CREDENTIALS',
  'NOT_FOUND',
  'FORBIDDEN',
  'INVALID_TRANSITION',
  'TASK_ALREADY_CLAIMED',
  'VALIDATION',
  'INTERNAL',
] as const

export type DomainCode = (typeof DOMAIN_CODES)[number]

export class DomainError extends Error {
  constructor(
    readonly code: DomainCode,
    readonly fields: string[] = [],
  ) {
    super(code)
  }
}
