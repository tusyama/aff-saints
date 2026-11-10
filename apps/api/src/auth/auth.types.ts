import type { Role } from '@prisma/client'

export type PublicUser = {
  id: string
  email: string
  name: string
  role: Role
}
