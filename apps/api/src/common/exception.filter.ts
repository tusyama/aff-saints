import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'
import { DomainError } from './domain-error'
import { httpStatus } from './http-status'

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>()
    if (exception instanceof DomainError) {
      response.status(httpStatus(exception.code)).json({ code: exception.code, fields: exception.fields })
      return
    }
    console.error(exception)
    response.status(httpStatus('INTERNAL')).json({ code: 'INTERNAL', fields: [] })
  }
}
