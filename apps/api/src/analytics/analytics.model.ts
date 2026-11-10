import type { TaskStatus } from '@prisma/client'

export type StatusCountModel = {
  status: TaskStatus
  count: number
}

export type OverdueTaskModel = {
  id: string
  offer: string
  assigneeName: string | null
  deadline: Date
  status: TaskStatus
}

export type CreativeLoadModel = {
  userId: string
  name: string
  inWork: number
  inReview: number
}

export type BuyerQueueModel = {
  userId: string
  name: string
  awaitingReview: number
}

export type CreditSumModel = {
  name: string
  credits: number
}

export type AnalyticsModel = {
  total: number
  countsByStatus: StatusCountModel[]
  overdueCount: number
  overdue: OverdueTaskModel[]
  averageCompletionMinutes: number | null
  creativeLoad: CreativeLoadModel[]
  buyerQueue: BuyerQueueModel[]
  creditsByService: CreditSumModel[]
  creditsByCreative: CreditSumModel[]
}
