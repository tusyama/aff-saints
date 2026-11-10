import { Role, TaskStatus } from '@prisma/client'
import { DomainError } from '../common/domain-error'

export type TransitionAction = 'claim' | 'submit' | 'requestChanges' | 'accept'

export type Actor = {
  id: string
  role: Role
}

export type TransitionTask = {
  status: TaskStatus
  authorId: string
  assigneeId: string | null
}

const SUBMIT_FROM = new Set<TaskStatus>([TaskStatus.IN_PROGRESS, TaskStatus.REVISIONS])

export function assertTransition(
  actor: Actor,
  task: TransitionTask,
  action: TransitionAction,
): { from: TaskStatus; to: TaskStatus } {
  if (action === 'claim') {
    if (actor.role !== Role.CREATIVE) throw new DomainError('FORBIDDEN')
    if (task.status !== TaskStatus.NEW || task.assigneeId !== null) {
      throw new DomainError('INVALID_TRANSITION')
    }
    return { from: TaskStatus.NEW, to: TaskStatus.IN_PROGRESS }
  }

  if (action === 'submit') {
    if (actor.role !== Role.CREATIVE || actor.id !== task.assigneeId) {
      throw new DomainError('FORBIDDEN')
    }
    if (!SUBMIT_FROM.has(task.status)) throw new DomainError('INVALID_TRANSITION')
    return { from: task.status, to: TaskStatus.IN_REVIEW }
  }

  if (action === 'requestChanges' || action === 'accept') {
    if (actor.role !== Role.BUYER || actor.id !== task.authorId) {
      throw new DomainError('FORBIDDEN')
    }
    if (task.status !== TaskStatus.IN_REVIEW) throw new DomainError('INVALID_TRANSITION')
    return {
      from: TaskStatus.IN_REVIEW,
      to: action === 'accept' ? TaskStatus.DONE : TaskStatus.REVISIONS,
    }
  }

  throw new DomainError('FORBIDDEN')
}
