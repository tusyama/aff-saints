import type { Role } from '@/api/types'

export const DEMO_PASSWORD = 'demo1234'

export const DEMO_ACCOUNTS: { email: string; name: string; role: Role }[] = [
  { email: 'anna@demo.local', name: 'Анна Ковалёва', role: 'BUYER' },
  { email: 'ilya@demo.local', name: 'Илья Сорокин', role: 'BUYER' },
  { email: 'maria@demo.local', name: 'Мария Лебедева', role: 'CREATIVE' },
  { email: 'pavel@demo.local', name: 'Павел Орлов', role: 'CREATIVE' },
  { email: 'egor@demo.local', name: 'Егор Никитин', role: 'CREATIVE' },
  { email: 'olga@demo.local', name: 'Ольга Сергеева', role: 'MANAGER' },
]
