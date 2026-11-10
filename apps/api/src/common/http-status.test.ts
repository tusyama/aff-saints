import { describe, expect, test } from 'bun:test'
import { DOMAIN_CODES } from './domain-error'
import { httpStatus } from './http-status'

describe('httpStatus', () => {
  test('maps every domain code', () => {
    expect(DOMAIN_CODES.map((code) => [code, httpStatus(code)])).toEqual([
      ['UNAUTHENTICATED', 401],
      ['INVALID_CREDENTIALS', 401],
      ['NOT_FOUND', 404],
      ['FORBIDDEN', 403],
      ['INVALID_TRANSITION', 409],
      ['TASK_ALREADY_CLAIMED', 409],
      ['VALIDATION', 400],
      ['INTERNAL', 500],
    ])
  })
})
