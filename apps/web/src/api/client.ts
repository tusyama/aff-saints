export class ApiError extends Error {
  readonly network: boolean

  constructor(
    readonly code: string,
    readonly fields: string[] = [],
    network = false,
  ) {
    super(code)
    this.network = network
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
}

export async function api<T>(path: string, options?: RequestOptions): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method: options?.method ?? 'GET',
      credentials: 'include',
      headers: options?.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: options?.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError('INTERNAL', [], true)
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  let payload: unknown
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    throw new ApiError('INTERNAL', [], true)
  }

  if (!response.ok) {
    const body = isRecord(payload) ? payload : {}
    const code = typeof body.code === 'string' ? body.code : 'INTERNAL'
    const fields = Array.isArray(body.fields) ? body.fields.filter((field): field is string => typeof field === 'string') : []
    throw new ApiError(code, fields)
  }

  return payload as T
}

function isRecord(value: unknown): value is { code?: unknown; fields?: unknown } {
  return typeof value === 'object' && value !== null
}
