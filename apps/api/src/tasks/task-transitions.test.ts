import { describe, expect, test } from 'bun:test'
import { Role, TaskStatus } from '@prisma/client'
import { DomainError } from '../common/domain-error'
import { assertTransition, type Actor, type TransitionTask } from './task-transitions'

const creative: Actor = { id: 'creative', role: Role.CREATIVE }
const otherCreative: Actor = { id: 'other', role: Role.CREATIVE }
const buyer: Actor = { id: 'buyer', role: Role.BUYER }
const otherBuyer: Actor = { id: 'other-buyer', role: Role.BUYER }
const manager: Actor = { id: 'manager', role: Role.MANAGER }

function task(patch: Partial<TransitionTask> = {}): TransitionTask {
  return {
    status: TaskStatus.NEW,
    authorId: buyer.id,
    assigneeId: null,
    ...patch,
  }
}

function code(run: () => void): string {
  try {
    run()
  } catch (error) {
    if (error instanceof DomainError) return error.code
    throw error
  }
  return 'OK'
}

describe('claim', () => {
  test('a creative claims an unassigned new task', () => {
    expect(assertTransition(creative, task(), 'claim')).toEqual({
      from: TaskStatus.NEW,
      to: TaskStatus.IN_PROGRESS,
    })
  })

  test('a buyer, a manager, and a taken task are refused', () => {
    expect(code(() => assertTransition(buyer, task(), 'claim'))).toBe('FORBIDDEN')
    expect(code(() => assertTransition(manager, task(), 'claim'))).toBe('FORBIDDEN')
    expect(
      code(() => assertTransition(creative, task({ assigneeId: creative.id, status: TaskStatus.IN_PROGRESS }), 'claim')),
    ).toBe('INVALID_TRANSITION')
  })
})

describe('submit', () => {
  test('the assignee submits from work or revisions', () => {
    expect(
      assertTransition(creative, task({ status: TaskStatus.IN_PROGRESS, assigneeId: creative.id }), 'submit').to,
    ).toBe(TaskStatus.IN_REVIEW)
    expect(
      assertTransition(creative, task({ status: TaskStatus.REVISIONS, assigneeId: creative.id }), 'submit').to,
    ).toBe(TaskStatus.IN_REVIEW)
  })

  test('someone else cannot submit, and the assignee cannot submit twice from review', () => {
    expect(
      code(() => assertTransition(otherCreative, task({ status: TaskStatus.IN_PROGRESS, assigneeId: creative.id }), 'submit')),
    ).toBe('FORBIDDEN')
    expect(
      code(() => assertTransition(creative, task({ status: TaskStatus.IN_REVIEW, assigneeId: creative.id }), 'submit')),
    ).toBe('INVALID_TRANSITION')
  })
})

describe('review', () => {
  const inReview = task({ status: TaskStatus.IN_REVIEW, assigneeId: creative.id })

  test('the author accepts or sends the task back', () => {
    expect(assertTransition(buyer, inReview, 'accept').to).toBe(TaskStatus.DONE)
    expect(assertTransition(buyer, inReview, 'requestChanges').to).toBe(TaskStatus.REVISIONS)
  })

  test('another buyer, the creative, and the manager cannot review', () => {
    expect(code(() => assertTransition(otherBuyer, inReview, 'accept'))).toBe('FORBIDDEN')
    expect(code(() => assertTransition(creative, inReview, 'accept'))).toBe('FORBIDDEN')
    expect(code(() => assertTransition(manager, inReview, 'requestChanges'))).toBe('FORBIDDEN')
  })

  test('the author cannot accept before review', () => {
    expect(
      code(() => assertTransition(buyer, task({ status: TaskStatus.IN_PROGRESS, assigneeId: creative.id }), 'accept')),
    ).toBe('INVALID_TRANSITION')
  })
})
