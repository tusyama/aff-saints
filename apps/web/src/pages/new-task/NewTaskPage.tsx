import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import type { CreativeType, Priority, TaskDetail } from '@/api/types'
import { useCommand } from '@/api/useGet'
import { useAuth } from '@/auth/AuthProvider'
import { errorText } from '@/constants/errors'
import { CREATIVE_TYPE_LABEL, PRIORITY_LABEL, optionsOf } from '@/constants/labels'
import { toIsoDeadline } from '@/lib/datetime'
import { Button, Select, Stack, TextArea, TextField } from '@/ui-kit'
import { Notice } from '@/components/Notice'
import { Form, UrlRow } from './NewTaskPage.styles'

export function NewTaskPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [offer, setOffer] = useState('')
  const [geo, setGeo] = useState('')
  const [creativeType, setCreativeType] = useState<CreativeType>('STATIC')
  const [quantity, setQuantity] = useState(1)
  const [description, setDescription] = useState('')
  const [urls, setUrls] = useState([''])
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [deadline, setDeadline] = useState('')
  const command = useCommand()

  if (user?.role !== 'BUYER') return <Notice>Недостаточно прав</Notice>

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    await command.run(async () => {
      const task = await api<TaskDetail>('/api/tasks', {
        method: 'POST',
        body: {
          offer,
          geo,
          creativeType,
          quantity: Number(quantity),
          description,
          referenceUrls: urls.map((url) => url.trim()).filter(Boolean),
          priority,
          deadline: toIsoDeadline(deadline),
        },
      })
      navigate(`/tasks/${task.id}`)
    })
  }

  return (
    <Form onSubmit={(event) => void onSubmit(event)}>
      <h1>Новая задача</h1>
      <TextField label="Оффер" name="offer" value={offer} onChange={(event) => setOffer(event.target.value)} required maxLength={120} />
      <TextField label="GEO" name="geo" placeholder="BR" value={geo} onChange={(event) => setGeo(event.target.value)} required maxLength={40} />
      <Select label="Тип креатива" name="creativeType" value={creativeType} options={optionsOf(CREATIVE_TYPE_LABEL)} onChange={(event) => setCreativeType(event.target.value as CreativeType)} />
      <TextField label="Количество" name="quantity" type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} required />
      <TextArea label="Описание" name="description" value={description} onChange={(event) => setDescription(event.target.value)} required maxLength={5000} />
      <Stack $gap="sm">
        {urls.map((url, index) => (
          <UrlRow key={index}>
            <TextField
              label={index === 0 ? 'Референсы' : 'Ещё ссылка'}
              name={`reference-${index}`}
              value={url}
              onChange={(event) => setUrls(urls.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
            />
            {urls.length > 1 ? (
              <Button type="button" $variant="ghost" onClick={() => setUrls(urls.filter((_, itemIndex) => itemIndex !== index))}>
                Убрать
              </Button>
            ) : null}
          </UrlRow>
        ))}
        {urls.length < 10 ? (
          <Button type="button" $variant="secondary" onClick={() => setUrls([...urls, ''])}>
            Добавить ссылку
          </Button>
        ) : null}
      </Stack>
      <Select label="Приоритет" name="priority" value={priority} options={optionsOf(PRIORITY_LABEL)} onChange={(event) => setPriority(event.target.value as Priority)} />
      <TextField label="Дедлайн" name="deadline" type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} required />
      {command.error ? <Notice>{errorText(command.error)}</Notice> : null}
      <Button type="submit" disabled={command.pending}>Создать</Button>
    </Form>
  )
}
