import { Link } from 'react-router-dom'
import { useGet } from '@/api/useGet'
import type { Analytics } from '@/api/types'
import { useAuth } from '@/auth/AuthProvider'
import { errorText } from '@/constants/errors'
import { STATUS_LABEL, STATUS_ORDER } from '@/constants/labels'
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus'
import { formatDateTime, formatDuration } from '@/lib/datetime'
import { Notice } from '@/components/Notice'
import { BarRow, Fill, Grid, Page, Panel, Person, Stat, Stats, StatValue, Track } from './AnalyticsPage.styles'

export function AnalyticsPage() {
  const { user } = useAuth()
  const manager = user?.role === 'MANAGER'
  const { data, error, fetching, reload } = useGet<Analytics>(manager ? '/api/analytics' : null)
  useRefetchOnFocus(reload)

  if (!manager) return <Notice>Недостаточно прав</Notice>
  if (fetching && !data && !error) return <p>Загрузка…</p>
  if (error || !data) return <Notice>{errorText(error)}</Notice>

  const maxCredits = Math.max(1, ...data.creditsByService.map((item) => item.credits), ...data.creditsByCreative.map((item) => item.credits))
  const average = data.averageCompletionMinutes == null ? '—' : formatDuration(Math.round(data.averageCompletionMinutes))

  return (
    <Page>
      <h1>Аналитика</h1>
      <Stats>
        <Stat>
          <StatValue>{data.total}</StatValue>
          <p>Всего задач</p>
        </Stat>
        {STATUS_ORDER.map((status) => (
          <Stat key={status}>
            <StatValue>{data.countsByStatus.find((item) => item.status === status)?.count ?? 0}</StatValue>
            <p>{STATUS_LABEL[status]}</p>
          </Stat>
        ))}
        <Stat>
          <StatValue>{average}</StatValue>
          <p>Среднее время выполнения</p>
          <p>От взятия в работу до приёмки</p>
        </Stat>
        <Stat>
          <StatValue>{data.overdueCount}</StatValue>
          <p>Просрочки</p>
        </Stat>
      </Stats>

      <Grid>
        <Panel>
          <h2>Просрочки</h2>
          {data.overdue.length === 0 ? <p>Нет просроченных задач</p> : null}
          {data.overdue.map((task) => (
            <Person key={task.id}>
              <Link to={`/tasks/${task.id}`}>{task.offer}</Link>
              <span>{task.assigneeName ?? 'Не назначен'} · {STATUS_LABEL[task.status]} · {formatDateTime(task.deadline)}</span>
            </Person>
          ))}
        </Panel>
        <Panel>
          <h2>Загрузка</h2>
          {data.creativeLoad.map((person) => (
            <Person key={person.userId}>
              <span>{person.name}</span>
              <span>{person.inWork} в работе · {person.inReview} на проверке</span>
            </Person>
          ))}
          {data.buyerQueue.map((person) => (
            <Person key={person.userId}>
              <span>{person.name}</span>
              <span>{person.awaitingReview} ждёт приёмки</span>
            </Person>
          ))}
        </Panel>
        <Panel>
          <h2>Кредиты по сервисам</h2>
          {data.creditsByService.map((item) => (
            <BarRow key={item.name}>
              <span>{item.name}</span>
              <Track><Fill $width={(item.credits / maxCredits) * 100} /></Track>
              <span>{item.credits}</span>
            </BarRow>
          ))}
        </Panel>
        <Panel>
          <h2>Кредиты по исполнителям</h2>
          {data.creditsByCreative.map((item) => (
            <BarRow key={item.name}>
              <span>{item.name}</span>
              <Track><Fill $width={(item.credits / maxCredits) * 100} /></Track>
              <span>{item.credits}</span>
            </BarRow>
          ))}
        </Panel>
      </Grid>
    </Page>
  )
}
