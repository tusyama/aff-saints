import type { ActivityType, CreativeType, Priority, TaskStatus } from '@prisma/client'

export type TaskCardModel = {
  id: string
  offer: string
  geo: string
  creativeType: CreativeType
  quantity: number
  priority: Priority
  deadline: Date
  status: TaskStatus
  assigneeName: string | null
  overdue: boolean
}

export type SubmissionModel = {
  id: string
  urls: string[]
  comment: string | null
  createdAt: Date
  authorName: string
}

export type AiUsageModel = {
  id: string
  serviceName: string
  credits: number
  note: string | null
  createdAt: Date
  authorName: string
}

export type ActivityModel = {
  id: string
  type: ActivityType
  fromStatus: TaskStatus | null
  toStatus: TaskStatus | null
  message: string | null
  createdAt: Date
  actorName: string
}

export type TaskDetailModel = {
  id: string
  offer: string
  geo: string
  creativeType: CreativeType
  quantity: number
  description: string
  referenceUrls: string[]
  priority: Priority
  deadline: Date
  status: TaskStatus
  createdAt: Date
  takenAt: Date | null
  completedAt: Date | null
  durationMinutes: number | null
  overdue: boolean
  authorId: string
  authorName: string
  assigneeId: string | null
  assigneeName: string | null
  submissions: SubmissionModel[]
  aiUsages: AiUsageModel[]
  activities: ActivityModel[]
}

export type AiServiceModel = {
  id: string
  name: string
}
