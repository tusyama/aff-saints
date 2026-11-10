import { Injectable } from '@nestjs/common'
import { Prisma, PrismaClient, TaskStatus } from '@prisma/client'
import type { PublicUser } from '../auth/auth.types'
import { DomainError } from '../common/domain-error'
import { PrismaService } from '../prisma/prisma.service'
import { assertTransition, type TransitionAction } from './task-transitions'
import { detailInclude, toCard, toDetail, type TaskDetailRecord } from './tasks.map'
import type { TaskCardModel, TaskDetailModel } from './tasks.model'
import type { AcceptTaskInput, AddAiUsageInput, CreateTaskInput, RequestChangesInput, SubmitWorkInput } from './tasks.inputs'
import { assertHttpUrls } from './urls'

type Store = PrismaClient | Prisma.TransactionClient

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: PublicUser): Promise<TaskCardModel[]> {
    const now = new Date()
    const tasks = await this.prisma.task.findMany({
      where: this.whereFor(user),
      orderBy: [{ priority: 'desc' }, { deadline: 'asc' }],
      include: { assignee: true },
    })
    return tasks.map((task) => toCard(task, now))
  }

  async get(user: PublicUser, id: string): Promise<TaskDetailModel> {
    const task = await this.requireTask(this.prisma, id, user)
    return toDetail(task, new Date())
  }

  async services() {
    return this.prisma.aiService.findMany({ orderBy: { name: 'asc' } })
  }

  async create(user: PublicUser, input: CreateTaskInput): Promise<TaskDetailModel> {
    if (user.role !== 'BUYER') throw new DomainError('FORBIDDEN')
    const offer = requiredText(input.offer, 'offer', 120)
    const geo = requiredText(input.geo, 'geo', 40)
    const description = requiredText(input.description, 'description', 5000)
    if (!Number.isInteger(input.quantity) || input.quantity < 1) {
      throw new DomainError('VALIDATION', ['quantity'])
    }
    const referenceUrls = assertHttpUrls(input.referenceUrls ?? [], 'referenceUrls')
    const deadline = futureDeadline(input.deadline)

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          offer,
          geo,
          creativeType: input.creativeType,
          quantity: input.quantity,
          description,
          referenceUrls,
          priority: input.priority,
          deadline,
          status: TaskStatus.NEW,
          authorId: user.id,
        },
      })
      await tx.activity.create({
        data: {
          taskId: created.id,
          actorId: user.id,
          type: 'CREATED',
          toStatus: TaskStatus.NEW,
        },
      })
      return toDetail(await this.requireTask(tx, created.id, user), new Date())
    })
  }

  claim(user: PublicUser, taskId: string): Promise<TaskDetailModel> {
    return this.transition(user, taskId, 'claim', async (tx, move) => {
      await tx.activity.create({
        data: {
          taskId,
          actorId: user.id,
          type: 'CLAIMED',
          fromStatus: move.from,
          toStatus: move.to,
        },
      })
    })
  }

  submit(user: PublicUser, input: SubmitWorkInput): Promise<TaskDetailModel> {
    const urls = assertHttpUrls(input.urls, 'urls')
    if (urls.length < 1) throw new DomainError('VALIDATION', ['urls'])
    const comment = optionalText(input.comment, 'comment', 2000)
    return this.transition(user, input.taskId, 'submit', async (tx, move) => {
      await tx.submission.create({
        data: { taskId: input.taskId, authorId: user.id, urls, comment },
      })
      await tx.activity.create({
        data: {
          taskId: input.taskId,
          actorId: user.id,
          type: 'SUBMITTED',
          fromStatus: move.from,
          toStatus: move.to,
          message: comment,
        },
      })
    })
  }

  requestChanges(user: PublicUser, input: RequestChangesInput): Promise<TaskDetailModel> {
    const comment = requiredText(input.comment, 'comment', 2000)
    return this.transition(user, input.taskId, 'requestChanges', async (tx, move) => {
      await tx.activity.create({
        data: {
          taskId: input.taskId,
          actorId: user.id,
          type: 'CHANGES_REQUESTED',
          fromStatus: move.from,
          toStatus: move.to,
          message: comment,
        },
      })
    })
  }

  accept(user: PublicUser, input: AcceptTaskInput): Promise<TaskDetailModel> {
    const comment = optionalText(input.comment, 'comment', 2000)
    return this.transition(user, input.taskId, 'accept', async (tx, move) => {
      await tx.activity.create({
        data: {
          taskId: input.taskId,
          actorId: user.id,
          type: 'ACCEPTED',
          fromStatus: move.from,
          toStatus: move.to,
          message: comment,
        },
      })
    })
  }

  async addAiUsage(user: PublicUser, input: AddAiUsageInput): Promise<TaskDetailModel> {
    if (!Number.isInteger(input.credits) || input.credits < 1 || input.credits > 1_000_000) {
      throw new DomainError('VALIDATION', ['credits'])
    }
    const note = optionalText(input.note, 'note', 2000)
    return this.prisma.$transaction(async (tx) => {
      const visible = await this.requireTask(tx, input.taskId, user)
      await tx.$queryRaw`SELECT id FROM "Task" WHERE id = ${visible.id} FOR UPDATE`
      const task = await tx.task.findUnique({ where: { id: visible.id } })
      if (!task) throw new DomainError('NOT_FOUND')
      if (task.assigneeId !== user.id) throw new DomainError('FORBIDDEN')
      if (task.status === TaskStatus.DONE) throw new DomainError('INVALID_TRANSITION')
      const service = await tx.aiService.findUnique({ where: { id: input.serviceId } })
      if (!service) throw new DomainError('VALIDATION', ['serviceId'])
      await tx.aiUsage.create({
        data: {
          taskId: task.id,
          userId: user.id,
          serviceId: service.id,
          credits: input.credits,
          note,
        },
      })
      await tx.activity.create({
        data: {
          taskId: task.id,
          actorId: user.id,
          type: 'AI_USAGE_ADDED',
          message: `${service.name} · ${input.credits}`,
        },
      })
      return toDetail(await this.requireTask(tx, task.id, user), new Date())
    })
  }

  private async transition(
    user: PublicUser,
    taskId: string,
    action: TransitionAction,
    write: (tx: Prisma.TransactionClient, move: { from: TaskStatus; to: TaskStatus }) => Promise<void>,
  ): Promise<TaskDetailModel> {
    return this.prisma.$transaction(async (tx) => {
      const task = await this.requireTask(tx, taskId, user)
      const move = assertTransition(user, task, action)
      const updated = await tx.task.updateMany({
        where: {
          id: taskId,
          status: move.from,
          ...(action === 'claim' ? { assigneeId: null } : {}),
        },
        data: {
          status: move.to,
          ...(action === 'claim' ? { assigneeId: user.id, takenAt: new Date() } : {}),
          ...(action === 'accept' ? { completedAt: new Date() } : {}),
        },
      })
      if (updated.count !== 1) {
        throw new DomainError(action === 'claim' ? 'TASK_ALREADY_CLAIMED' : 'INVALID_TRANSITION')
      }
      await write(tx, move)
      return toDetail(await this.requireTask(tx, taskId, user), new Date())
    })
  }

  private whereFor(user: PublicUser): Prisma.TaskWhereInput {
    if (user.role === 'MANAGER') return {}
    if (user.role === 'BUYER') return { authorId: user.id }
    return {
      OR: [
        { status: TaskStatus.NEW, assigneeId: null },
        { assigneeId: user.id },
      ],
    }
  }

  private async requireTask(store: Store, id: string, user: PublicUser): Promise<TaskDetailRecord> {
    const task = await store.task.findFirst({
      where: { id, AND: [this.whereFor(user)] },
      include: detailInclude,
    })
    if (!task) throw new DomainError('NOT_FOUND')
    return task
  }
}

function requiredText(value: string, field: string, max: number): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > max) throw new DomainError('VALIDATION', [field])
  return trimmed
}

function optionalText(value: string | null | undefined, field: string, max: number): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > max) throw new DomainError('VALIDATION', [field])
  return trimmed
}

function futureDeadline(value: Date): Date {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    throw new DomainError('VALIDATION', ['deadline'])
  }
  return date
}
