import { DomainError } from '../common/domain-error'

const MAX_URLS = 10
const MAX_URL_LENGTH = 2000

export function assertHttpUrls(values: string[], field: string): string[] {
  if (values.length > MAX_URLS) throw new DomainError('VALIDATION', [field])
  return values.map((value) => parseHttpUrl(value, field))
}

function parseHttpUrl(value: string, field: string): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) {
    throw new DomainError('VALIDATION', [field])
  }
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    throw new DomainError('VALIDATION', [field])
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new DomainError('VALIDATION', [field])
  }
  return url.toString()
}
