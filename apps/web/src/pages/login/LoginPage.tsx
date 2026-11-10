import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { api, ApiError } from '@/api/client'
import { useAuth } from '@/auth/AuthProvider'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/constants/accounts'
import { errorText } from '@/constants/errors'
import { ROLE_LABEL } from '@/constants/labels'
import { Button, Stack, TextField } from '@/ui-kit'
import { Notice } from '@/components/Notice'
import { Account, Card, Screen, Title } from './LoginPage.styles'

export function LoginPage() {
  const { user, fetching, refetch } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [pending, setPending] = useState(false)

  if (fetching) return <Screen>Загрузка…</Screen>
  if (user) return <Navigate to="/board" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await api('/api/session', { method: 'POST', body: { email, password } })
      const next = await refetch()
      if (!next) setError(new ApiError('INTERNAL', [], true))
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError('INTERNAL', [], true))
    } finally {
      setPending(false)
    }
  }

  return (
    <Screen>
      <Card as="form" onSubmit={(event) => void onSubmit(event)}>
        <Stack $gap="xs">
          <Title>Креатив</Title>
          <Notice $tone="muted">Задачи отдела</Notice>
        </Stack>
        <TextField label="Почта" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <TextField label="Пароль" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error ? <Notice>{errorText(error)}</Notice> : null}
        <Button type="submit" disabled={pending}>Войти</Button>
        <Stack $gap="sm">
          {DEMO_ACCOUNTS.map((account) => (
            <Account
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email)
                setPassword(DEMO_PASSWORD)
              }}
            >
              <span>{account.name}</span>
              <span>{ROLE_LABEL[account.role]}</span>
            </Account>
          ))}
        </Stack>
      </Card>
    </Screen>
  )
}
