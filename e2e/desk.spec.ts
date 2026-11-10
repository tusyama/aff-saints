import { expect, test, type Page } from '@playwright/test'

test('a claimed task is hidden from the other creative', async ({ page }) => {
  const offer = `Сценарий ${Date.now()}`

  await login(page, 'Анна Ковалёва')
  await page.getByRole('link', { name: 'Новая задача' }).click()
  await page.getByLabel('Оффер').fill(offer)
  await page.getByLabel('GEO').fill('DE')
  await page.getByLabel('Описание').fill('Баннер для проверки видимости')
  await page.getByLabel('Дедлайн').fill(localDeadline())
  await page.getByRole('button', { name: 'Создать' }).click()
  await page.waitForURL(/\/tasks\/(?!new$)[^/]+$/)
  await expect(page.getByText(offer)).toBeVisible()
  const taskPath = new URL(page.url()).pathname

  await login(page, 'Мария Лебедева')
  await page.goto(taskPath)
  await page.getByRole('button', { name: 'Взять в работу' }).click()
  await expect(page.getByText('Креативщик: Мария Лебедева')).toBeVisible()

  await login(page, 'Павел Орлов')
  await page.goto(taskPath)
  await expect(page.getByText('Задача не найдена')).toBeVisible()
  await expect(page.getByText(offer)).toHaveCount(0)
})

async function login(page: Page, name: string): Promise<void> {
  await page.goto('/login')
  await Promise.race([
    page.waitForURL('**/board'),
    page.getByRole('button', { name: 'Войти' }).waitFor(),
  ])
  if (page.url().includes('/board')) {
    await page.getByRole('button', { name: 'Выйти' }).click()
    await page.waitForURL('**/login')
  }
  await page.getByRole('button', { name }).click()
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.waitForURL('**/board')
}

function localDeadline(): string {
  const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
