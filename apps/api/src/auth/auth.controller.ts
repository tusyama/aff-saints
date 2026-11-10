import { Body, Controller, Delete, Get, HttpCode, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import { writeSessionCookie } from '../common/session'
import { AuthService } from './auth.service'
import type { PublicUser } from './auth.types'
import { LoginInput } from './login.input'

@Controller('api')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('session')
  async login(@Body() body: LoginInput, @Res({ passthrough: true }) response: Response): Promise<PublicUser> {
    const user = await this.auth.login(body.email, body.password)
    response.setHeader('Set-Cookie', writeSessionCookie(this.auth.sign(user)))
    return user
  }

  @Delete('session')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.setHeader('Set-Cookie', writeSessionCookie('', 0))
  }

  @Get('me')
  async me(@Req() request: Request, @Res() response: Response): Promise<void> {
    const user = await this.auth.userFromRequest(request)
    response.json(user)
  }
}
