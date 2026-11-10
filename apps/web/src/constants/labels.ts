import type { ActivityType, CreativeType, Priority, Role, TaskStatus } from '@/api/types'

export const STATUS_ORDER: TaskStatus[] = ['NEW', 'IN_PROGRESS', 'IN_REVIEW', 'REVISIONS', 'DONE']

export const STATUS_LABEL: Record<TaskStatus, string> = {
  NEW: 'Новые',
  IN_PROGRESS: 'В работе',
  IN_REVIEW: 'На проверке',
  REVISIONS: 'Правки',
  DONE: 'Готово',
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Срочный',
}

export const CREATIVE_TYPE_LABEL: Record<CreativeType, string> = {
  STATIC: 'Статика',
  VIDEO: 'Видео',
  MOTION: 'Motion',
  UGC: 'UGC',
  LANDING: 'Лендинг',
  OTHER: 'Другое',
}

export const ROLE_LABEL: Record<Role, string> = {
  BUYER: 'Байер',
  CREATIVE: 'Креативщик',
  MANAGER: 'Руководитель',
}

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  CREATED: 'Задача создана',
  CLAIMED: 'Взята в работу',
  SUBMITTED: 'Работа сдана',
  CHANGES_REQUESTED: 'Отправлена на правки',
  ACCEPTED: 'Работа принята',
  AI_USAGE_ADDED: 'Указан расход AI',
}

export function optionsOf<T extends string>(labels: Record<T, string>): { value: T; label: string }[] {
  return Object.entries(labels).map(([value, label]) => ({ value: value as T, label: label as string }))
}
