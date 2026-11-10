import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { compare } from 'bcryptjs'
import type { Request } from 'express'
import { DomainError } from '../common/domain-error'
import { readSessionCookie } from '../common/session'
import { PrismaService } from '../prisma/prisma.service'
import type { PublicUser } from './auth.types'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string): Promise<PublicUser> {
    const normalized = email.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({ where: { email: normalized } })
    const matches = user ? await compare(password, user.passwordHash) : false
    if (!user || !matches) throw new DomainError('INVALID_CREDENTIALS')
    return toPublic(user)
  }

  sign(user: PublicUser): string {
    return this.jwt.sign({ sub: user.id })
  }

  async userFromRequest(request: Request): Promise<PublicUser | null> {
    const token = readSessionCookie(request.headers.cookie)
    if (!token) return null
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: string }>(token)
      if (!payload.sub) return null
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } })
      return user ? toPublic(user) : null
    } catch {
      return null
    }
  }
}

function toPublic(user: { id: string; email: string; name: string; role: PublicUser['role'] }): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}
