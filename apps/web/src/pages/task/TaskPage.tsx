import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/api/client'
import type { AiService, TaskDetail } from '@/api/types'
import { useCommand, useGet } from '@/api/useGet'
import { useAuth } from '@/auth/AuthProvider'
import { errorText } from '@/constants/errors'
import { ACTIVITY_LABEL, CREATIVE_TYPE_LABEL, PRIORITY_LABEL, STATUS_LABEL } from '@/constants/labels'
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus'
import { formatDateTime, formatDuration } from '@/lib/datetime'
import { Badge, Button, Select, Stack, TextArea, TextField } from '@/ui-kit'
import { Notice } from '@/components/Notice'
import { Event, LinkList, Muted, Page, Row, Section, Text, Timeline, Title } from './TaskPage.styles'

export function TaskPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const { data: task, error, fetching, reload } = useGet<TaskDetail>(id ? `/api/tasks/${id}` : null)
  const { data: services } = useGet<AiService[]>('/api/ai-services')
  useRefetchOnFocus(reload)

  if (fetching && !task && !error) return <p>Загрузка…</p>
  if (error || !task || !user) return <Notice>{errorText(error) ?? 'Задача не найдена'}</Notice>

  const isAssignee = task.assigneeId === user.id
  const isAuthor = task.authorId === user.id
  const canClaim = user.role === 'CREATIVE' && task.status === 'NEW' && !task.assigneeId
  const canSubmit = isAssignee && (task.status === 'IN_PROGRESS' || task.status === 'REVISIONS')
  const canLogCredits = isAssignee && task.status !== 'DONE'
  const canReview = isAuthor && task.status === 'IN_REVIEW'

  return (
    <Page>
      <Stack $gap="sm">
        <Row>
          <Badge $color={statusColor(task.status)}>{STATUS_LABEL[task.status]}</Badge>
          {task.overdue ? <Notice>Просрочено</Notice> : null}
        </Row>
        <Title>{task.offer}</Title>
        <Muted>
          {task.geo} · {CREATIVE_TYPE_LABEL[task.creativeType]} · {task.quantity} шт. · {PRIORITY_LABEL[task.priority]}
        </Muted>
        <Muted>Дедлайн {formatDateTime(task.deadline)}</Muted>
        <Muted>Байер: {task.authorName}</Muted>
        <Muted>Креативщик: {task.assigneeName ?? 'Не назначен'}</Muted>
      </Stack>

      <Section>
        <h2>Описание</h2>
        <Text>{task.description}</Text>
      </Section>

      <Section>
        <h2>Референсы</h2>
        {task.referenceUrls.length === 0 ? <Muted>Нет ссылок</Muted> : <ExternalLinks urls={task.referenceUrls} />}
      </Section>

      <Section>
        <h2>Сроки</h2>
        <Muted>Создана: {formatDateTime(task.createdAt)}</Muted>
        <Muted>Взята в работу: {task.takenAt ? formatDateTime(task.takenAt) : '—'}</Muted>
        <Muted>Завершена: {task.completedAt ? formatDateTime(task.completedAt) : '—'}</Muted>
        <Muted>Длительность: {formatDuration(task.durationMinutes)}</Muted>
        <Muted>От взятия в работу до приёмки</Muted>
      </Section>

      <Section>
        <h2>Результат</h2>
        {task.submissions.length === 0 ? <Muted>Пока ничего не сдано</Muted> : null}
        {task.submissions.map((submission) => (
          <Stack key={submission.id} $gap="xs">
            <Muted>{formatDateTime(submission.createdAt)} · {submission.authorName}</Muted>
            <ExternalLinks urls={submission.urls} />
            {submission.comment ? <Text>{submission.comment}</Text> : null}
          </Stack>
        ))}
      </Section>

      <Section>
        <h2>Расход AI</h2>
        {task.aiUsages.length === 0 ? <Muted>Расход не указан</Muted> : null}
        {task.aiUsages.map((usage) => (
          <Muted key={usage.id}>
            {usage.serviceName} · {usage.credits} · {formatDateTime(usage.createdAt)}
            {usage.note ? ` · ${usage.note}` : ''}
          </Muted>
        ))}
        {canLogCredits ? <CreditForm taskId={task.id} services={services ?? []} onDone={reload} /> : null}
      </Section>

      {canClaim || canSubmit || canReview ? (
        <Section>
          <h2>Действия</h2>
          {canClaim ? <ClaimButton taskId={task.id} onDone={reload} /> : null}
          {canSubmit ? <SubmitForm taskId={task.id} onDone={reload} /> : null}
          {canReview ? <ReviewForm taskId={task.id} onDone={reload} /> : null}
        </Section>
      ) : null}

      <Section>
        <h2>История</h2>
        <Timeline>
          {task.activities.map((activity) => (
            <Event key={activity.id}>
              <strong>{ACTIVITY_LABEL[activity.type]}</strong>
              <Muted>{activity.actorName} · {formatDateTime(activity.createdAt)}</Muted>
              {activity.message ? <Text>{activity.message}</Text> : null}
            </Event>
          ))}
        </Timeline>
      </Section>
    </Page>
  )
}

function ExternalLinks({ urls }: { urls: string[] }) {
  return (
    <LinkList>
      {urls.map((url) => (
        <li key={url}>
          <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
        </li>
      ))}
    </LinkList>
  )
}

function ClaimButton({ taskId, onDone }: { taskId: string; onDone: () => void }) {
  const command = useCommand()
  return (
    <Stack $gap="sm">
      <Button
        type="button"
        disabled={command.pending}
        onClick={() => void command.run(async () => {
          await api(`/api/tasks/${taskId}/claim`, { method: 'POST' })
          onDone()
        })}
      >
        Взять в работу
      </Button>
      {command.error ? <Notice>{errorText(command.error)}</Notice> : null}
    </Stack>
  )
}

function SubmitForm({ taskId, onDone }: { taskId: string; onDone: () => void }) {
  const [urls, setUrls] = useState([''])
  const [comment, setComment] = useState('')
  const command = useCommand()

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const ok = await command.run(async () => {
      await api(`/api/tasks/${taskId}/submissions`, {
        method: 'POST',
        body: { urls: urls.map((url) => url.trim()).filter(Boolean), comment: comment.trim() || null },
      })
    })
    if (ok) {
      setUrls([''])
      setComment('')
      onDone()
    }
  }

  return (
    <Stack as="form" $gap="sm" onSubmit={(event) => void onSubmit(event)}>
      {urls.map((url, index) => (
        <TextField key={index} label={index === 0 ? 'Ссылка на результат' : 'Ещё ссылка'} name={`url-${index}`} value={url} onChange={(event) => setUrls(urls.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))} />
      ))}
      {urls.length < 10 ? <Button type="button" $variant="secondary" onClick={() => setUrls([...urls, ''])}>Добавить ссылку</Button> : null}
      <TextArea label="Комментарий" name="comment" value={comment} onChange={(event) => setComment(event.target.value)} />
      {command.error ? <Notice>{errorText(command.error)}</Notice> : null}
      <Button type="submit" disabled={command.pending}>Сдать работу</Button>
    </Stack>
  )
}

function CreditForm({ taskId, services, onDone }: { taskId: string; services: AiService[]; onDone: () => void }) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '')
  const [credits, setCredits] = useState(1)
  const [note, setNote] = useState('')
  const command = useCommand()

  useEffect(() => {
    if (!serviceId && services[0]) setServiceId(services[0].id)
  }, [serviceId, services])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const ok = await command.run(async () => {
      await api(`/api/tasks/${taskId}/ai-usage`, {
        method: 'POST',
        body: { serviceId, credits: Number(credits), note: note.trim() || null },
      })
    })
    if (ok) {
      setCredits(1)
      setNote('')
      onDone()
    }
  }

  return (
    <Stack as="form" $gap="sm" onSubmit={(event) => void onSubmit(event)}>
      <Select label="Сервис" name="serviceId" value={serviceId} options={services.map((service) => ({ value: service.id, label: service.name }))} onChange={(event) => setServiceId(event.target.value)} />
      <TextField label="Кредиты" name="credits" type="number" min={1} max={1000000} value={credits} onChange={(event) => setCredits(Number(event.target.value))} />
      <TextField label="Заметка" name="note" value={note} onChange={(event) => setNote(event.target.value)} />
      {command.error ? <Notice>{errorText(command.error)}</Notice> : null}
      <Button type="submit" $variant="secondary" disabled={command.pending || !serviceId}>Добавить расход</Button>
    </Stack>
  )
}

function ReviewForm({ taskId, onDone }: { taskId: string; onDone: () => void }) {
  const [comment, setComment] = useState('')
  const accept = useCommand()
  const changes = useCommand()
  const busy = accept.pending || changes.pending

  return (
    <Stack $gap="sm">
      <TextArea label="Комментарий" name="review" value={comment} onChange={(event) => setComment(event.target.value)} />
      <Row>
        <Button
          type="button"
          disabled={busy}
          onClick={() => void accept.run(async () => {
            await api(`/api/tasks/${taskId}/acceptance`, {
              method: 'POST',
              body: { comment: comment.trim() || null },
            })
            onDone()
          })}
        >
          Принять
        </Button>
        <Button
          type="button"
          $variant="danger"
          disabled={busy || !comment.trim()}
          onClick={() => void changes.run(async () => {
            await api(`/api/tasks/${taskId}/changes`, {
              method: 'POST',
              body: { comment: comment.trim() },
            })
            onDone()
          })}
        >
          На правки
        </Button>
      </Row>
      {accept.error ? <Notice>{errorText(accept.error)}</Notice> : null}
      {changes.error ? <Notice>{errorText(changes.error)}</Notice> : null}
    </Stack>
  )
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    NEW: '#44403c',
    IN_PROGRESS: '#0f6e6b',
    IN_REVIEW: '#b45309',
    REVISIONS: '#9f1239',
    DONE: '#3f6212',
  }
  return colors[status] ?? '#44403c'
}
