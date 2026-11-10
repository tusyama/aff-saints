export type Role = 'BUYER' | 'CREATIVE' | 'MANAGER'

export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'IN_REVIEW' | 'REVISIONS' | 'DONE'

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type CreativeType = 'STATIC' | 'VIDEO' | 'MOTION' | 'UGC' | 'LANDING' | 'OTHER'

export type ActivityType = 'CREATED' | 'CLAIMED' | 'SUBMITTED' | 'CHANGES_REQUESTED' | 'ACCEPTED' | 'AI_USAGE_ADDED'

export type User = {
  id: string
  email: string
  name: string
  role: Role
}

export type TaskCard = {
  id: string
  offer: string
  geo: string
  creativeType: CreativeType
  quantity: number
  priority: Priority
  deadline: string
  status: TaskStatus
  assigneeName: string | null
  overdue: boolean
}

export type Submission = {
  id: string
  urls: string[]
  comment: string | null
  createdAt: string
  authorName: string
}

export type AiUsage = {
  id: string
  serviceName: string
  credits: number
  note: string | null
  createdAt: string
  authorName: string
}

export type Activity = {
  id: string
  type: ActivityType
  fromStatus: TaskStatus | null
  toStatus: TaskStatus | null
  message: string | null
  createdAt: string
  actorName: string
}

export type TaskDetail = {
  id: string
  offer: string
  geo: string
  creativeType: CreativeType
  quantity: number
  description: string
  referenceUrls: string[]
  priority: Priority
  deadline: string
  status: TaskStatus
  createdAt: string
  takenAt: string | null
  completedAt: string | null
  durationMinutes: number | null
  overdue: boolean
  authorId: string
  authorName: string
  assigneeId: string | null
  assigneeName: string | null
  submissions: Submission[]
  aiUsages: AiUsage[]
  activities: Activity[]
}

export type AiService = {
  id: string
  name: string
}

export type Analytics = {
  total: number
  countsByStatus: { status: TaskStatus; count: number }[]
  overdueCount: number
  overdue: {
    id: string
    offer: string
    assigneeName: string | null
    deadline: string
    status: TaskStatus
  }[]
  averageCompletionMinutes: number | null
  creativeLoad: { userId: string; name: string; inWork: number; inReview: number }[]
  buyerQueue: { userId: string; name: string; awaitingReview: number }[]
  creditsByService: { name: string; credits: number }[]
  creditsByCreative: { name: string; credits: number }[]
}
