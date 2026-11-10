import { Injectable } from '@nestjs/common'
import { Prisma, Role, TaskStatus } from '@prisma/client'
import type { PublicUser } from '../auth/auth.types'
import { DomainError } from '../common/domain-error'
import { PrismaService } from '../prisma/prisma.service'
import type { AnalyticsModel } from './analytics.model'

const STATUS_ORDER: TaskStatus[] = [
  TaskStatus.NEW,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.REVISIONS,
  TaskStatus.DONE,
]

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(user: PublicUser): Promise<AnalyticsModel> {
    if (user.role !== Role.MANAGER) throw new DomainError('FORBIDDEN')
    const now = new Date()

    const [statusGroups, overdue, averageRows, creatives, loadGroups, buyers, queueGroups, services, serviceGroups, usageByUser] =
      await Promise.all([
        this.prisma.task.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.task.findMany({
          where: { status: { not: TaskStatus.DONE }, deadline: { lt: now } },
          include: { assignee: true },
          orderBy: { deadline: 'asc' },
        }),
        this.prisma.$queryRaw<Array<{ minutes: unknown }>>(Prisma.sql`
          SELECT AVG(EXTRACT(EPOCH FROM ("completedAt" - "takenAt")) / 60.0) AS minutes
          FROM "Task"
          WHERE status = 'DONE'::"TaskStatus"
            AND "completedAt" > "takenAt"
        `),
        this.prisma.user.findMany({ where: { role: Role.CREATIVE }, orderBy: { name: 'asc' } }),
        this.prisma.task.groupBy({
          by: ['assigneeId', 'status'],
          where: {
            assigneeId: { not: null },
            status: { in: [TaskStatus.IN_PROGRESS, TaskStatus.REVISIONS, TaskStatus.IN_REVIEW] },
          },
          _count: { _all: true },
        }),
        this.prisma.user.findMany({ where: { role: Role.BUYER }, orderBy: { name: 'asc' } }),
        this.prisma.task.groupBy({
          by: ['authorId'],
          where: { status: TaskStatus.IN_REVIEW },
          _count: { _all: true },
        }),
        this.prisma.aiService.findMany({ orderBy: { name: 'asc' } }),
        this.prisma.aiUsage.groupBy({ by: ['serviceId'], _sum: { credits: true } }),
        this.prisma.aiUsage.groupBy({ by: ['userId'], _sum: { credits: true } }),
      ])

    const countByStatus = new Map(statusGroups.map((row) => [row.status, row._count._all]))
    const countsByStatus = STATUS_ORDER.map((status) => ({
      status,
      count: countByStatus.get(status) ?? 0,
    }))

    const load = new Map<string, { inWork: number; inReview: number }>()
    for (const row of loadGroups) {
      if (!row.assigneeId) continue
      const current = load.get(row.assigneeId) ?? { inWork: 0, inReview: 0 }
      if (row.status === TaskStatus.IN_REVIEW) current.inReview += row._count._all
      else current.inWork += row._count._all
      load.set(row.assigneeId, current)
    }

    const queue = new Map(queueGroups.map((row) => [row.authorId, row._count._all]))
    const creditsByServiceId = new Map(serviceGroups.map((row) => [row.serviceId, row._sum.credits ?? 0]))
    const creditsByUserId = new Map(usageByUser.map((row) => [row.userId, row._sum.credits ?? 0]))

    return {
      total: countsByStatus.reduce((sum, row) => sum + row.count, 0),
      countsByStatus,
      overdueCount: overdue.length,
      overdue: overdue.map((task) => ({
        id: task.id,
        offer: task.offer,
        assigneeName: task.assignee?.name ?? null,
        deadline: task.deadline,
        status: task.status,
      })),
      averageCompletionMinutes: asMinutes(averageRows[0]?.minutes),
      creativeLoad: creatives.map((creative) => ({
        userId: creative.id,
        name: creative.name,
        inWork: load.get(creative.id)?.inWork ?? 0,
        inReview: load.get(creative.id)?.inReview ?? 0,
      })),
      buyerQueue: buyers.map((buyer) => ({
        userId: buyer.id,
        name: buyer.name,
        awaitingReview: queue.get(buyer.id) ?? 0,
      })),
      creditsByService: services
        .map((service) => ({ name: service.name, credits: creditsByServiceId.get(service.id) ?? 0 }))
        .sort((a, b) => b.credits - a.credits || a.name.localeCompare(b.name)),
      creditsByCreative: creatives
        .map((creative) => ({ name: creative.name, credits: creditsByUserId.get(creative.id) ?? 0 }))
        .sort((a, b) => b.credits - a.credits || a.name.localeCompare(b.name)),
    }
  }
}

function asMinutes(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const minutes = Number(value)
  return Number.isFinite(minutes) ? minutes : null
}
