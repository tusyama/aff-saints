import { ApiError } from '@/api/client'

const ERROR_TEXT: Record<string, string> = {
  UNAUTHENTICATED: 'Войдите в аккаунт',
  INVALID_CREDENTIALS: 'Неверная почта или пароль',
  NOT_FOUND: 'Задача не найдена',
  FORBIDDEN: 'Недостаточно прав',
  INVALID_TRANSITION: 'Это действие сейчас недоступно',
  TASK_ALREADY_CLAIMED: 'Задачу уже взяли',
  VALIDATION: 'Проверьте поля формы',
  INTERNAL: 'Что-то пошло не так',
}

const FIELD_TEXT: Record<string, string> = {
  offer: 'Укажите оффер',
  geo: 'Укажите GEO',
  description: 'Добавьте описание',
  deadline: 'Укажите дедлайн в будущем',
  referenceUrls: 'Ссылка должна начинаться с http:// или https://',
  urls: 'Добавьте хотя бы одну ссылку http или https',
  credits: 'Укажите кредиты от 1 до 1 000 000',
  comment: 'Нужен комментарий',
  quantity: 'Количество от 1',
  serviceId: 'Выберите сервис',
}

export function errorText(error: ApiError | null): string | null {
  if (!error) return null
  if (error.network) return 'Нет связи с сервером'
  if (error.code === 'VALIDATION') {
    const field = error.fields[0]
    if (field && FIELD_TEXT[field]) return FIELD_TEXT[field]
  }
  return ERROR_TEXT[error.code] ?? ERROR_TEXT.INTERNAL
}
