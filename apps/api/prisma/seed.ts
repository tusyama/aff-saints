import { ActivityType, CreativeType, PrismaClient, Priority, Role, TaskStatus } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()
const hour = 60 * 60 * 1000
const day = 24 * hour

const accounts = [
  { email: 'anna@demo.local', name: 'Анна Ковалёва', role: Role.BUYER },
  { email: 'ilya@demo.local', name: 'Илья Сорокин', role: Role.BUYER },
  { email: 'maria@demo.local', name: 'Мария Лебедева', role: Role.CREATIVE },
  { email: 'pavel@demo.local', name: 'Павел Орлов', role: Role.CREATIVE },
  { email: 'egor@demo.local', name: 'Егор Никитин', role: Role.CREATIVE },
  { email: 'olga@demo.local', name: 'Ольга Сергеева', role: Role.MANAGER },
] as const

const serviceNames = ['Midjourney', 'Flux', 'Kling', 'Runway', 'ChatGPT', 'ElevenLabs']

type Person = 'anna' | 'ilya' | 'maria' | 'pavel'

type ActivitySeed = {
  type: ActivityType
  at: Date
  actor: Person
  from?: TaskStatus
  to?: TaskStatus
  message?: string
}

type TaskSeed = {
  offer: string
  geo: string
  creativeType: CreativeType
  quantity: number
  description: string
  referenceUrls: string[]
  priority: Priority
  deadline: Date
  status: TaskStatus
  author: Person
  assignee?: Person
  createdAt: Date
  takenAt?: Date
  completedAt?: Date
  activities: ActivitySeed[]
  submissions?: { at: Date; actor: Person; urls: string[]; comment?: string }[]
  usages?: { at: Date; actor: Person; service: string; credits: number; note?: string }[]
}

async function main(): Promise<void> {
  const passwordHash = await hash('demo1234', 10)
  const users = new Map<Person, { id: string }>()
  for (const account of accounts) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, role: account.role, passwordHash },
      create: { ...account, passwordHash },
    })
    const key = account.email.split('@')[0] as Person
    if (key !== 'egor' && key !== 'olga') users.set(key, user)
  }

  const services = new Map<string, { id: string }>()
  for (const name of serviceNames) {
    const service = await prisma.aiService.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    services.set(name, service)
  }

  if ((await prisma.task.count()) > 0) return

  const now = Date.now()
  const at = (delta: number) => new Date(now + delta)
  const healthCompleted = at(-26 * hour)
  const healthTaken = new Date(healthCompleted.getTime() - 2 * hour)

  const stories: TaskSeed[] = [
    {
      offer: 'Статика для кредитной карты',
      geo: 'BR',
      creativeType: CreativeType.STATIC,
      quantity: 4,
      description: 'Четыре баннера 1080×1080. Акцент на кэшбэк и бесплатное обслуживание в первый месяц. Без обещания гарантированного одобрения.',
      referenceUrls: ['https://example.com/refs/card-br'],
      priority: Priority.HIGH,
      deadline: at(4 * day),
      status: TaskStatus.NEW,
      author: 'anna',
      createdAt: at(-2 * hour),
      activities: [{ type: ActivityType.CREATED, at: at(-2 * hour), actor: 'anna', to: TaskStatus.NEW }],
    },
    {
      offer: 'Видео для ставок на спорт',
      geo: 'DE',
      creativeType: CreativeType.VIDEO,
      quantity: 2,
      description: 'Два ролика по 15 секунд. Первый заход — эмоция гола, второй — бонус на первый депозит. Текст на немецком.',
      referenceUrls: ['https://example.com/refs/sport-de'],
      priority: Priority.URGENT,
      deadline: at(-1 * day),
      status: TaskStatus.NEW,
      author: 'ilya',
      createdAt: at(-3 * day),
      activities: [{ type: ActivityType.CREATED, at: at(-3 * day), actor: 'ilya', to: TaskStatus.NEW }],
    },
    {
      offer: 'UGC для доставки еды',
      geo: 'PL',
      creativeType: CreativeType.UGC,
      quantity: 6,
      description: 'Шесть коротких роликов от лица курьера и клиента. Показать время доставки и промокод на первый заказ.',
      referenceUrls: [],
      priority: Priority.MEDIUM,
      deadline: at(6 * day),
      status: TaskStatus.NEW,
      author: 'anna',
      createdAt: at(-1 * day),
      activities: [{ type: ActivityType.CREATED, at: at(-1 * day), actor: 'anna', to: TaskStatus.NEW }],
    },
    {
      offer: 'Motion для криптокошелька',
      geo: 'KZ',
      creativeType: CreativeType.MOTION,
      quantity: 3,
      description: 'Три ролика 9:16. Объяснить перевод за минуту и хранение фразы. Без обещания доходности.',
      referenceUrls: ['https://example.com/refs/wallet-kz'],
      priority: Priority.LOW,
      deadline: at(8 * day),
      status: TaskStatus.NEW,
      author: 'ilya',
      createdAt: at(-5 * hour),
      activities: [{ type: ActivityType.CREATED, at: at(-5 * hour), actor: 'ilya', to: TaskStatus.NEW }],
    },
    {
      offer: 'Статика для страховки путешествий',
      geo: 'TR',
      creativeType: CreativeType.STATIC,
      quantity: 5,
      description: 'Пять баннеров: семья в аэропорту, медицинская помощь, отмена рейса. Дедлайн жёсткий.',
      referenceUrls: ['https://example.com/refs/travel-tr'],
      priority: Priority.HIGH,
      deadline: at(2 * day),
      status: TaskStatus.IN_PROGRESS,
      author: 'anna',
      assignee: 'maria',
      createdAt: at(-8 * hour),
      takenAt: at(-5 * hour),
      activities: [
        { type: ActivityType.CREATED, at: at(-8 * hour), actor: 'anna', to: TaskStatus.NEW },
        { type: ActivityType.CLAIMED, at: at(-5 * hour), actor: 'maria', from: TaskStatus.NEW, to: TaskStatus.IN_PROGRESS },
      ],
      usages: [{ at: at(-4 * hour), actor: 'maria', service: 'Midjourney', credits: 40, note: 'Фоны аэропорта' }],
    },
    {
      offer: 'Лендинг для займа',
      geo: 'ES',
      creativeType: CreativeType.LANDING,
      quantity: 1,
      description: 'Один лендинг: сумма, срок и калькулятор платежа. Юридический дисклеймер на первом экране.',
      referenceUrls: ['https://example.com/refs/loan-es'],
      priority: Priority.URGENT,
      deadline: at(-2 * day),
      status: TaskStatus.IN_PROGRESS,
      author: 'ilya',
      assignee: 'pavel',
      createdAt: at(-3 * day),
      takenAt: at(-1 * day),
      activities: [
        { type: ActivityType.CREATED, at: at(-3 * day), actor: 'ilya', to: TaskStatus.NEW },
        { type: ActivityType.CLAIMED, at: at(-1 * day), actor: 'pavel', from: TaskStatus.NEW, to: TaskStatus.IN_PROGRESS },
      ],
      usages: [{ at: at(-12 * hour), actor: 'pavel', service: 'ChatGPT', credits: 12, note: 'Черновик структуры' }],
    },
    {
      offer: 'Статика для онлайн-казино',
      geo: 'BR',
      creativeType: CreativeType.STATIC,
      quantity: 8,
      description: 'Восемь объявлений под разные слоты. Яркий фон, читаемый бонус, пометка 18+.',
      referenceUrls: ['https://example.com/refs/casino-br'],
      priority: Priority.MEDIUM,
      deadline: at(1 * day),
      status: TaskStatus.IN_REVIEW,
      author: 'anna',
      assignee: 'maria',
      createdAt: at(-2 * day),
      takenAt: at(-30 * hour),
      activities: [
        { type: ActivityType.CREATED, at: at(-2 * day), actor: 'anna', to: TaskStatus.NEW },
        { type: ActivityType.CLAIMED, at: at(-30 * hour), actor: 'maria', from: TaskStatus.NEW, to: TaskStatus.IN_PROGRESS },
        { type: ActivityType.SUBMITTED, at: at(-6 * hour), actor: 'maria', from: TaskStatus.IN_PROGRESS, to: TaskStatus.IN_REVIEW, message: 'Восемь макетов в папке.' },
      ],
      submissions: [{ at: at(-6 * hour), actor: 'maria', urls: ['https://example.com/work/casino-br/v1'], comment: 'Восемь макетов в папке.' }],
      usages: [{ at: at(-20 * hour), actor: 'maria', service: 'Flux', credits: 25 }],
    },
    {
      offer: 'Видео для сервиса знакомств',
      geo: 'FR',
      creativeType: CreativeType.VIDEO,
      quantity: 2,
      description: 'Два видео по 20 секунд: совпадение в приложении и встреча в кафе. Французские субтитры.',
      referenceUrls: ['https://example.com/refs/dating-fr'],
      priority: Priority.LOW,
      deadline: at(5 * day),
      status: TaskStatus.IN_REVIEW,
      author: 'ilya',
      assignee: 'pavel',
      createdAt: at(-3 * day),
      takenAt: at(-2 * day),
      activities: [
        { type: ActivityType.CREATED, at: at(-3 * day), actor: 'ilya', to: TaskStatus.NEW },
        { type: ActivityType.CLAIMED, at: at(-2 * day), actor: 'pavel', from: TaskStatus.NEW, to: TaskStatus.IN_PROGRESS },
        { type: ActivityType.SUBMITTED, at: at(-20 * hour), actor: 'pavel', from: TaskStatus.IN_PROGRESS, to: TaskStatus.IN_REVIEW },
      ],
      submissions: [{ at: at(-20 * hour), actor: 'pavel', urls: ['https://example.com/work/dating-fr/v1'] }],
      usages: [{ at: at(-36 * hour), actor: 'pavel', service: 'Kling', credits: 80 }],
    },
    {
      offer: 'UGC для беттинга',
      geo: 'IT',
      creativeType: CreativeType.UGC,
      quantity: 4,
      description: 'Четыре ролика про экспресс дня. После первой сдачи нужно убрать лишний кадр и переснять хук.',
      referenceUrls: ['https://example.com/refs/betting-it'],
      priority: Priority.HIGH,
      deadline: at(1 * day),
      status: TaskStatus.REVISIONS,
      author: 'anna',
      assignee: 'pavel',
      createdAt: at(-4 * day),
      takenAt: at(-3 * day),
      activities: [
        { type: ActivityType.CREATED, at: at(-4 * day), actor: 'anna', to: TaskStatus.NEW },
        { type: ActivityType.CLAIMED, at: at(-3 * day), actor: 'pavel', from: TaskStatus.NEW, to: TaskStatus.IN_PROGRESS },
        { type: ActivityType.SUBMITTED, at: at(-2 * day), actor: 'pavel', from: TaskStatus.IN_PROGRESS, to: TaskStatus.IN_REVIEW, message: 'Первая версия четырёх роликов.' },
        {
          type: ActivityType.CHANGES_REQUESTED,
          at: at(-1 * day),
          actor: 'anna',
          from: TaskStatus.IN_REVIEW,
          to: TaskStatus.REVISIONS,
          message: 'Уберите кадр со ставкой рядом с подростками и переснимите первые две секунды.',
        },
      ],
      submissions: [{ at: at(-2 * day), actor: 'pavel', urls: ['https://example.com/work/betting-it/v1'], comment: 'Первая версия четырёх роликов.' }],
      usages: [{ at: at(-2 * day + 2 * hour), actor: 'pavel', service: 'ChatGPT', credits: 15, note: 'Тексты хуков' }],
    },
    {
      offer: 'Статика для медицинской страховки',
      geo: 'AE',
      creativeType: CreativeType.STATIC,
      quantity: 3,
      description: 'Три баннера для медицинского полиса: цена, покрытие и срок оформления.',
      referenceUrls: ['https://example.com/refs/health-ae'],
      priority: Priority.MEDIUM,
      deadline: at(3 * day),
      status: TaskStatus.DONE,
      author: 'anna',
      assignee: 'maria',
      createdAt: new Date(healthTaken.getTime() - hour),
      takenAt: healthTaken,
      completedAt: healthCompleted,
      activities: [
        { type: ActivityType.CREATED, at: new Date(healthTaken.getTime() - hour), actor: 'anna', to: TaskStatus.NEW },
        { type: ActivityType.CLAIMED, at: healthTaken, actor: 'maria', from: TaskStatus.NEW, to: TaskStatus.IN_PROGRESS },
        {
          type: ActivityType.SUBMITTED,
          at: new Date(healthTaken.getTime() + 90 * 60 * 1000),
          actor: 'maria',
          from: TaskStatus.IN_PROGRESS,
          to: TaskStatus.IN_REVIEW,
        },
        { type: ActivityType.ACCEPTED, at: healthCompleted, actor: 'anna', from: TaskStatus.IN_REVIEW, to: TaskStatus.DONE, message: 'Принято, можно в запуск.' },
      ],
      submissions: [{
        at: new Date(healthTaken.getTime() + 90 * 60 * 1000),
        actor: 'maria',
        urls: ['https://example.com/work/health-ae/v1'],
      }],
      usages: [{ at: new Date(healthTaken.getTime() + 30 * 60 * 1000), actor: 'maria', service: 'Midjourney', credits: 30 }],
    },
    {
      offer: 'Видео для автокредита',
      geo: 'MX',
      creativeType: CreativeType.VIDEO,
      quantity: 2,
      description: 'Два ролика про одобрение автокредита за день. Во второй версии автомобиль стоит в первых секундах.',
      referenceUrls: ['https://example.com/refs/auto-mx'],
      priority: Priority.HIGH,
      deadline: at(2 * day),
      status: TaskStatus.DONE,
      author: 'ilya',
      assignee: 'pavel',
      createdAt: at(-5 * day),
      takenAt: at(-4 * day),
      completedAt: at(-12 * hour),
      activities: [
        { type: ActivityType.CREATED, at: at(-5 * day), actor: 'ilya', to: TaskStatus.NEW },
        { type: ActivityType.CLAIMED, at: at(-4 * day), actor: 'pavel', from: TaskStatus.NEW, to: TaskStatus.IN_PROGRESS },
        { type: ActivityType.SUBMITTED, at: at(-3 * day), actor: 'pavel', from: TaskStatus.IN_PROGRESS, to: TaskStatus.IN_REVIEW, message: 'Первая версия: ключи и одобрение.' },
        {
          type: ActivityType.CHANGES_REQUESTED,
          at: at(-2 * day),
          actor: 'ilya',
          from: TaskStatus.IN_REVIEW,
          to: TaskStatus.REVISIONS,
          message: 'Покажите сам автомобиль в первых трёх секундах и замените финальный кадр.',
        },
        { type: ActivityType.SUBMITTED, at: at(-1 * day), actor: 'pavel', from: TaskStatus.REVISIONS, to: TaskStatus.IN_REVIEW, message: 'Автомобиль в начале, новый финал.' },
        { type: ActivityType.ACCEPTED, at: at(-12 * hour), actor: 'ilya', from: TaskStatus.IN_REVIEW, to: TaskStatus.DONE, message: 'Готово к заливу.' },
      ],
      submissions: [
        { at: at(-3 * day), actor: 'pavel', urls: ['https://example.com/work/auto-mx/v1'], comment: 'Первая версия: ключи и одобрение.' },
        { at: at(-1 * day), actor: 'pavel', urls: ['https://example.com/work/auto-mx/v2'], comment: 'Автомобиль в начале, новый финал.' },
      ],
      usages: [
        { at: at(-3 * day - 12 * hour), actor: 'pavel', service: 'Kling', credits: 100, note: 'Первый ролик' },
        { at: at(-36 * hour), actor: 'pavel', service: 'Runway', credits: 60, note: 'Правка финала' },
      ],
    },
    {
      offer: 'Лендинг для онлайн-курсов',
      geo: 'KZ',
      creativeType: CreativeType.LANDING,
      quantity: 1,
      description: 'Один лендинг курса: программа, преподаватель и кнопка на пробный урок.',
      referenceUrls: ['https://example.com/refs/courses-kz'],
      priority: Priority.MEDIUM,
      deadline: at(4 * day),
      status: TaskStatus.DONE,
      author: 'anna',
      assignee: 'maria',
      createdAt: at(-2 * day),
      takenAt: at(-40 * hour),
      completedAt: at(-26 * hour),
      activities: [
        { type: ActivityType.CREATED, at: at(-2 * day), actor: 'anna', to: TaskStatus.NEW },
        { type: ActivityType.CLAIMED, at: at(-40 * hour), actor: 'maria', from: TaskStatus.NEW, to: TaskStatus.IN_PROGRESS },
        { type: ActivityType.SUBMITTED, at: at(-30 * hour), actor: 'maria', from: TaskStatus.IN_PROGRESS, to: TaskStatus.IN_REVIEW },
        { type: ActivityType.ACCEPTED, at: at(-26 * hour), actor: 'anna', from: TaskStatus.IN_REVIEW, to: TaskStatus.DONE },
      ],
      submissions: [{ at: at(-30 * hour), actor: 'maria', urls: ['https://example.com/work/courses-kz/v1'] }],
      usages: [
        { at: at(-36 * hour), actor: 'maria', service: 'ElevenLabs', credits: 18, note: 'Озвучка преподавателя' },
        { at: at(-34 * hour), actor: 'maria', service: 'Flux', credits: 20 },
      ],
    },
  ]

  await prisma.$transaction(async (tx) => {
    for (const story of stories) {
      const task = await tx.task.create({
        data: {
          offer: story.offer,
          geo: story.geo,
          creativeType: story.creativeType,
          quantity: story.quantity,
          description: story.description,
          referenceUrls: story.referenceUrls,
          priority: story.priority,
          deadline: story.deadline,
          status: story.status,
          authorId: idOf(users, story.author),
          assigneeId: story.assignee ? idOf(users, story.assignee) : null,
          createdAt: story.createdAt,
          takenAt: story.takenAt ?? null,
          completedAt: story.completedAt ?? null,
        },
      })
      for (const activity of story.activities) {
        await tx.activity.create({
          data: {
            taskId: task.id,
            actorId: idOf(users, activity.actor),
            type: activity.type,
            fromStatus: activity.from ?? null,
            toStatus: activity.to ?? null,
            message: activity.message ?? null,
            createdAt: activity.at,
          },
        })
      }
      for (const submission of story.submissions ?? []) {
        await tx.submission.create({
          data: {
            taskId: task.id,
            authorId: idOf(users, submission.actor),
            urls: submission.urls,
            comment: submission.comment ?? null,
            createdAt: submission.at,
          },
        })
      }
      for (const usage of story.usages ?? []) {
        await tx.aiUsage.create({
          data: {
            taskId: task.id,
            userId: idOf(users, usage.actor),
            serviceId: services.get(usage.service)!.id,
            credits: usage.credits,
            note: usage.note ?? null,
            createdAt: usage.at,
          },
        })
        await tx.activity.create({
          data: {
            taskId: task.id,
            actorId: idOf(users, usage.actor),
            type: ActivityType.AI_USAGE_ADDED,
            message: `${usage.service} · ${usage.credits}`,
            createdAt: usage.at,
          },
        })
      }
    }
  }, { maxWait: 20_000, timeout: 120_000 })
}

function idOf(users: Map<Person, { id: string }>, person: Person): string {
  const user = users.get(person)
  if (!user) throw new Error(`Missing demo user ${person}`)
  return user.id
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
