import { useGet } from '@/api/useGet'
import type { TaskCard } from '@/api/types'
import { errorText } from '@/constants/errors'
import { CREATIVE_TYPE_LABEL, PRIORITY_LABEL, STATUS_LABEL, STATUS_ORDER } from '@/constants/labels'
import { formatDateTime } from '@/lib/datetime'
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus'
import { Badge, Stack } from '@/ui-kit'
import { Notice } from '@/components/Notice'
import { Board, Card, Column, ColumnTitle, Hint, Meta, Offer, Overdue } from './BoardPage.styles'

export function BoardPage() {
  const { data, error, fetching, reload } = useGet<TaskCard[]>('/api/tasks')
  useRefetchOnFocus(reload)

  if (fetching && !data && !error) return <p>Загрузка…</p>
  if (error || !data) return <Notice>{errorText(error)}</Notice>

  return (
    <Stack $gap="md">
      <Hint>Статус меняется внутри карточки задачи.</Hint>
      <Board>
        {STATUS_ORDER.map((status) => {
          const column = data.filter((task) => task.status === status)
          return (
            <Column key={status}>
              <ColumnTitle>
                <Badge $color={statusColor(status)}>{STATUS_LABEL[status]}</Badge>
                <span>{column.length}</span>
              </ColumnTitle>
              {column.length === 0 ? <Meta>Пока пусто</Meta> : null}
              {column.map((task) => (
                <TaskCardView key={task.id} task={task} />
              ))}
            </Column>
          )
        })}
      </Board>
    </Stack>
  )
}

function TaskCardView({ task }: { task: TaskCard }) {
  return (
    <Card to={`/tasks/${task.id}`}>
      <Offer>{task.offer}</Offer>
      <Meta>
        {task.geo} · {CREATIVE_TYPE_LABEL[task.creativeType]} · {PRIORITY_LABEL[task.priority]}
      </Meta>
      <Meta>до {formatDateTime(task.deadline)}</Meta>
      <Meta>{task.assigneeName ?? 'Не назначен'}</Meta>
      {task.overdue ? <Overdue>Просрочено</Overdue> : null}
    </Card>
  )
}

function statusColor(status: TaskCard['status']): string {
  const colors: Record<TaskCard['status'], string> = {
    NEW: '#44403c',
    IN_PROGRESS: '#0f6e6b',
    IN_REVIEW: '#b45309',
    REVISIONS: '#9f1239',
    DONE: '#3f6212',
  }
  return colors[status]
}
