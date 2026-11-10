import { afterAll, beforeAll, expect, test } from 'bun:test'
import { hash } from 'bcryptjs'
import { PrismaClient, Role, TaskStatus, type CreativeType, type Priority } from '@prisma/client'

const databaseUrl = process.env.SCENARIO_DATABASE_URL ?? 'postgresql://desk:desk@127.0.0.1:5432/desk_test'
const databaseName = new URL(databaseUrl).pathname.slice(1)
if (databaseName === 'desk') throw new Error('Refusing to run scenario tests against the demo database')

process.env.DATABASE_URL = databaseUrl
process.env.JWT_SECRET = 'scenario-only-secret'

const apiRoot = `${import.meta.dir}/..`
const repoRoot = `${import.meta.dir}/../..`
const password = 'demo1234'

type App = {
  listen(port: number, host: string): Promise<unknown>
  close(): Promise<void>
  getHttpServer(): { address(): { port: number } | string | null }
}

type Reply = { status: number; text: string; json: unknown; cookie: string | null }

let app: App
let prisma: PrismaClient
let base = ''
let annaId = ''
let mariaId = ''
let serviceId = ''

beforeAll(async () => {
  await ensureDatabase()
  await run(apiRoot, ['bunx', 'prisma', 'migrate', 'deploy'], { DATABASE_URL: databaseUrl })
  prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } })
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Activity", "AiUsage", "Submission", "Task", "AiService", "User" RESTART IDENTITY CASCADE',
  )
  const passwordHash = await hash(password, 10)
  const [anna, , maria] = await Promise.all([
    prisma.user.create({ data: { email: 'anna@scenario.local', name: 'Анна', passwordHash, role: Role.BUYER } }),
    prisma.user.create({ data: { email: 'ilya@scenario.local', name: 'Илья', passwordHash, role: Role.BUYER } }),
    prisma.user.create({ data: { email: 'maria@scenario.local', name: 'Мария', passwordHash, role: Role.CREATIVE } }),
    prisma.user.create({ data: { email: 'pavel@scenario.local', name: 'Павел', passwordHash, role: Role.CREATIVE } }),
  ])
  const service = await prisma.aiService.create({ data: { name: 'ChatGPT' } })
  annaId = anna.id
  mariaId = maria.id
  serviceId = service.id

  const loaded = (await import('../dist/app.js')) as { createApp: (options?: { logger?: false }) => Promise<App> }
  app = await loaded.createApp({ logger: false })
  await app.listen(0, '127.0.0.1')
  const address = app.getHttpServer().address()
  if (!address || typeof address === 'string') throw new Error('The scenario server did not bind a port')
  base = `http://127.0.0.1:${address.port}`
}, 60_000)

afterAll(async () => {
  await app?.close()
  await prisma?.$disconnect()
})

test('anonymous me is a json null', async () => {
  const reply = await request('/api/me')
  expect(reply.status).toBe(200)
  expect(reply.text).toBe('null')
})

test('a past deadline does not create a task', async () => {
  const cookie = await login('anna@scenario.local')
  const before = await prisma.task.count()
  const reply = await request('/api/tasks', {
    method: 'POST',
    cookie,
    body: brief('Прошлое', '2020-01-01T00:00:00.000Z'),
  })
  expect(reply.status).toBe(400)
  expect(reply.json).toEqual({ code: 'VALIDATION', fields: ['deadline'] })
  expect(await prisma.task.count()).toBe(before)
})

test('buyers stay apart and a claim hides the task from the other creative', async () => {
  const anna = await login('anna@scenario.local')
  const created = await request('/api/tasks', { method: 'POST', cookie: anna, body: brief('Общий пул') })
  expect(created.status).toBe(201)
  const id = idOf(created.json)

  const ilya = await login('ilya@scenario.local')
  const ilyaList = await request('/api/tasks', { cookie: ilya })
  expect(idsOf(ilyaList.json)).not.toContain(id)
  const ilyaTask = await request(`/api/tasks/${id}`, { cookie: ilya })
  expect(ilyaTask.status).toBe(404)
  expect(ilyaTask.json).toEqual({ code: 'NOT_FOUND', fields: [] })

  const maria = await login('maria@scenario.local')
  const pavel = await login('pavel@scenario.local')
  expect(idsOf((await request('/api/tasks', { cookie: maria })).json)).toContain(id)
  expect(idsOf((await request('/api/tasks', { cookie: pavel })).json)).toContain(id)

  const claim = await request(`/api/tasks/${id}/claim`, { method: 'POST', cookie: maria })
  expect(claim.status).toBe(201)
  expect(statusOf(claim.json)).toBe('IN_PROGRESS')

  const hidden = await request(`/api/tasks/${id}`, { cookie: pavel })
  expect(hidden.status).toBe(404)
  expect(hidden.json).toEqual({ code: 'NOT_FOUND', fields: [] })
  expect(idsOf((await request('/api/tasks', { cookie: pavel })).json)).not.toContain(id)
  expect((await request(`/api/tasks/${id}`, { cookie: anna })).status).toBe(200)
})

test('a javascript url is rejected and the task stays in progress', async () => {
  const anna = await login('anna@scenario.local')
  const created = await request('/api/tasks', { method: 'POST', cookie: anna, body: brief('Ссылка') })
  const id = idOf(created.json)
  const maria = await login('maria@scenario.local')
  expect((await request(`/api/tasks/${id}/claim`, { method: 'POST', cookie: maria })).status).toBe(201)

  const submit = await request(`/api/tasks/${id}/submissions`, {
    method: 'POST',
    cookie: maria,
    body: { urls: ['javascript:alert(1)'], comment: null },
  })
  expect(submit.status).toBe(400)
  expect(submit.json).toEqual({ code: 'VALIDATION', fields: ['urls'] })

  const stored = await prisma.task.findUnique({ where: { id }, include: { submissions: true } })
  expect(stored?.status).toBe(TaskStatus.IN_PROGRESS)
  expect(stored?.submissions).toHaveLength(0)
})

test('a done task accepts neither a submission nor credits', async () => {
  const task = await prisma.task.create({
    data: {
      offer: 'Уже готово',
      geo: 'BR',
      creativeType: 'STATIC' satisfies CreativeType,
      quantity: 1,
      description: 'Закрыта',
      referenceUrls: [],
      priority: 'LOW' satisfies Priority,
      deadline: new Date(Date.now() + 86_400_000),
      status: TaskStatus.DONE,
      authorId: annaId,
      assigneeId: mariaId,
      takenAt: new Date(Date.now() - 3_600_000),
      completedAt: new Date(),
    },
  })
  const maria = await login('maria@scenario.local')
  const submit = await request(`/api/tasks/${task.id}/submissions`, {
    method: 'POST',
    cookie: maria,
    body: { urls: ['https://example.com/final'], comment: null },
  })
  expect(submit.status).toBe(409)
  expect(submit.json).toEqual({ code: 'INVALID_TRANSITION', fields: [] })

  const credits = await request(`/api/tasks/${task.id}/ai-usage`, {
    method: 'POST',
    cookie: maria,
    body: { serviceId, credits: 3, note: null },
  })
  expect(credits.status).toBe(409)
  expect(credits.json).toEqual({ code: 'INVALID_TRANSITION', fields: [] })

  const stored = await prisma.task.findUnique({ where: { id: task.id }, include: { submissions: true, aiUsages: true } })
  expect(stored?.status).toBe(TaskStatus.DONE)
  expect(stored?.submissions).toHaveLength(0)
  expect(stored?.aiUsages).toHaveLength(0)
})

test('a credit that arrives during acceptance does not land on the finished task', async () => {
  const task = await prisma.task.create({
    data: {
      offer: 'Гонка приёмки',
      geo: 'DE',
      creativeType: 'STATIC',
      quantity: 1,
      description: 'Ещё в работе',
      referenceUrls: [],
      priority: 'MEDIUM',
      deadline: new Date(Date.now() + 86_400_000),
      status: TaskStatus.IN_PROGRESS,
      authorId: annaId,
      assigneeId: mariaId,
      takenAt: new Date(),
    },
  })
  const locker = new PrismaClient({ datasources: { db: { url: databaseUrl } } })
  let release = () => {}
  const released = new Promise<void>((resolve) => {
    release = resolve
  })
  let holding = () => {}
  const held = new Promise<void>((resolve) => {
    holding = resolve
  })
  const acceptance = locker.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Task" WHERE id = ${task.id} FOR UPDATE`
    holding()
    await released
    await tx.task.update({
      where: { id: task.id },
      data: { status: TaskStatus.DONE, completedAt: new Date() },
    })
  }, { timeout: 20_000 })

  let pending: Promise<Reply> | undefined
  try {
    await held
    const maria = await login('maria@scenario.local')
    pending = request(`/api/tasks/${task.id}/ai-usage`, {
      method: 'POST',
      cookie: maria,
      body: { serviceId, credits: 4, note: null },
    })
    await waitForLockWaiter()
    release()
    const credits = await pending
    await acceptance
    expect(credits.status).toBe(409)
    expect(credits.json).toEqual({ code: 'INVALID_TRANSITION', fields: [] })
    const stored = await prisma.task.findUnique({ where: { id: task.id }, include: { aiUsages: true } })
    expect(stored?.status).toBe(TaskStatus.DONE)
    expect(stored?.aiUsages).toHaveLength(0)
  } finally {
    release()
    await pending?.catch(() => undefined)
    await acceptance.catch(() => undefined)
    await locker.$disconnect()
  }
})

function brief(offer: string, deadline = new Date(Date.now() + 86_400_000).toISOString()) {
  return {
    offer,
    geo: 'DE',
    creativeType: 'STATIC',
    quantity: 1,
    description: 'Проверка сценария',
    referenceUrls: [] as string[],
    priority: 'MEDIUM',
    deadline,
  }
}

async function login(email: string): Promise<string> {
  const reply = await request('/api/session', { method: 'POST', body: { email, password } })
  if (reply.status !== 201 || !reply.cookie) throw new Error(`Login failed for ${email}: ${reply.status} ${reply.text}`)
  return reply.cookie
}

async function request(path: string, init?: { method?: string; cookie?: string; body?: unknown }): Promise<Reply> {
  const response = await fetch(`${base}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      ...(init?.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(init?.cookie ? { cookie: init.cookie } : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  })
  const text = await response.text()
  const setCookie = response.headers.getSetCookie?.()[0] ?? response.headers.get('set-cookie')
  return {
    status: response.status,
    text,
    json: text ? (JSON.parse(text) as unknown) : undefined,
    cookie: setCookie?.split(';')[0] ?? null,
  }
}

function idOf(value: unknown): string {
  if (!value || typeof value !== 'object' || !('id' in value) || typeof value.id !== 'string') {
    throw new Error('Response has no task id')
  }
  return value.id
}

function statusOf(value: unknown): string {
  if (!value || typeof value !== 'object' || !('status' in value) || typeof value.status !== 'string') {
    throw new Error('Response has no task status')
  }
  return value.status
}

function idsOf(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error('Response is not a task list')
  return value.map((item) => idOf(item))
}

async function waitForLockWaiter(): Promise<void> {
  const deadline = Date.now() + 4_000
  while (Date.now() < deadline) {
    const rows = await prisma.$queryRaw<Array<{ waiting: number }>>`
      SELECT COUNT(*)::int AS waiting FROM pg_locks WHERE NOT granted
    `
    if (Number(rows[0]?.waiting) > 0) return
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  throw new Error('The credit request did not wait on the task row')
}

async function ensureDatabase(): Promise<void> {
  const probe = new PrismaClient({ datasources: { db: { url: databaseUrl } } })
  try {
    await probe.$queryRaw`SELECT 1`
    return
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes('does not exist') && !message.includes('P1003')) {
      throw new Error(
        `Cannot reach ${databaseUrl}. Start Postgres with docker compose -f docker-compose.yml -f docker-compose.dev.yml up db -d. ${message}`,
      )
    }
  } finally {
    await probe.$disconnect()
  }
  await run(repoRoot, [
    'docker',
    'compose',
    'exec',
    '-T',
    'db',
    'psql',
    '-U',
    'desk',
    '-d',
    'desk',
    '-c',
    'CREATE DATABASE desk_test',
  ])
}

async function run(cwd: string, command: string[], env?: Record<string, string>): Promise<void> {
  const child = Bun.spawn(command, {
    cwd,
    env: { ...process.env, ...env },
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ])
  if (code !== 0) throw new Error(`${command.join(' ')} failed\n${stdout}\n${stderr}`)
}
