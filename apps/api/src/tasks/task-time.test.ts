import { describe, expect, test } from 'bun:test'
import { durationMinutes, isOverdue } from './task-time'

const hour = 60 * 60 * 1000

describe('durationMinutes', () => {
  test('is null when a timestamp is missing', () => {
    const now = new Date('2026-11-01T12:00:00.000Z')
    expect(durationMinutes(null, now)).toBeNull()
    expect(durationMinutes(now, null)).toBeNull()
  })

  test('is null when acceptance is before the claim', () => {
    const taken = new Date('2026-11-01T12:00:00.000Z')
    const completed = new Date(taken.getTime() - hour)
    expect(durationMinutes(taken, completed)).toBeNull()
  })

  test('floors an exact two-hour span to 120 minutes', () => {
    const taken = new Date('2026-11-01T10:00:00.000Z')
    const completed = new Date(taken.getTime() + 2 * hour)
    expect(durationMinutes(taken, completed)).toBe(120)
  })

  test('floors a sub-minute span to 0', () => {
    const taken = new Date('2026-11-01T10:00:00.000Z')
    const completed = new Date(taken.getTime() + 30_000)
    expect(durationMinutes(taken, completed)).toBe(0)
  })
})

describe('isOverdue', () => {
  const now = new Date('2026-11-10T00:00:00.000Z')

  test('is overdue when the deadline has passed and the task is open', () => {
    expect(isOverdue(new Date('2026-11-09T00:00:00.000Z'), 'NEW', now)).toBe(true)
    expect(isOverdue(new Date('2026-11-09T00:00:00.000Z'), 'IN_PROGRESS', now)).toBe(true)
  })

  test('is not overdue before the deadline', () => {
    expect(isOverdue(new Date('2026-11-11T00:00:00.000Z'), 'NEW', now)).toBe(false)
  })

  test('a finished task is never overdue', () => {
    expect(isOverdue(new Date('2026-11-01T00:00:00.000Z'), 'DONE', now)).toBe(false)
  })
})
