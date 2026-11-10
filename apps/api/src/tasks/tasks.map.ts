import { Prisma } from '@prisma/client'
import { durationMinutes, isOverdue } from './task-time'
import type { TaskCardModel, TaskDetailModel } from './tasks.model'

export const detailInclude = {
  author: true,
  assignee: true,
  submissions: { orderBy: { createdAt: 'asc' as const }, include: { author: true } },
  aiUsages: { orderBy: { createdAt: 'asc' as const }, include: { service: true, user: true } },
  activities: { orderBy: { createdAt: 'asc' as const }, include: { actor: true } },
} satisfies Prisma.TaskInclude

export type TaskDetailRecord = Prisma.TaskGetPayload<{ include: typeof detailInclude }>
export type TaskCardRecord = Prisma.TaskGetPayload<{ include: { assignee: true } }>

export function toCard(task: TaskCardRecord, now: Date): TaskCardModel {
  return {
    id: task.id,
    offer: task.offer,
    geo: task.geo,
    creativeType: task.creativeType,
    quantity: task.quantity,
    priority: task.priority,
    deadline: task.deadline,
    status: task.status,
    assigneeName: task.assignee?.name ?? null,
    overdue: isOverdue(task.deadline, task.status, now),
  }
}

export function toDetail(task: TaskDetailRecord, now: Date): TaskDetailModel {
  return {
    id: task.id,
    offer: task.offer,
    geo: task.geo,
    creativeType: task.creativeType,
    quantity: task.quantity,
    description: task.description,
    referenceUrls: task.referenceUrls,
    priority: task.priority,
    deadline: task.deadline,
    status: task.status,
    createdAt: task.createdAt,
    takenAt: task.takenAt,
    completedAt: task.completedAt,
    durationMinutes: durationMinutes(task.takenAt, task.completedAt),
    overdue: isOverdue(task.deadline, task.status, now),
    authorId: task.authorId,
    authorName: task.author.name,
    assigneeId: task.assigneeId,
    assigneeName: task.assignee?.name ?? null,
    submissions: task.submissions.map((submission) => ({
      id: submission.id,
      urls: submission.urls,
      comment: submission.comment,
      createdAt: submission.createdAt,
      authorName: submission.author.name,
    })),
    aiUsages: task.aiUsages.map((usage) => ({
      id: usage.id,
      serviceName: usage.service.name,
      credits: usage.credits,
      note: usage.note,
      createdAt: usage.createdAt,
      authorName: usage.user.name,
    })),
    activities: task.activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      fromStatus: activity.fromStatus,
      toStatus: activity.toStatus,
      message: activity.message,
      createdAt: activity.createdAt,
      actorName: activity.actor.name,
    })),
  }
}
