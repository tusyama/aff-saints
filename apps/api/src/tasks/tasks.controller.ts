import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { PublicUser } from '../auth/auth.types'
import { AcceptTaskBody, AddAiUsageBody, CreateTaskInput, RequestChangesBody, SubmitWorkBody } from './tasks.inputs'
import type { AiServiceModel, TaskCardModel, TaskDetailModel } from './tasks.model'
import { TasksService } from './tasks.service'

@Controller('api')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('tasks')
  tasks(@CurrentUser() user: PublicUser): Promise<TaskCardModel[]> {
    return this.tasksService.list(user)
  }

  @Get('ai-services')
  aiServices(): Promise<AiServiceModel[]> {
    return this.tasksService.services()
  }

  @Get('tasks/:id')
  task(@CurrentUser() user: PublicUser, @Param('id') id: string): Promise<TaskDetailModel> {
    return this.tasksService.get(user, id)
  }

  @Post('tasks')
  create(@CurrentUser() user: PublicUser, @Body() input: CreateTaskInput): Promise<TaskDetailModel> {
    return this.tasksService.create(user, input)
  }

  @Post('tasks/:id/claim')
  claim(@CurrentUser() user: PublicUser, @Param('id') id: string): Promise<TaskDetailModel> {
    return this.tasksService.claim(user, id)
  }

  @Post('tasks/:id/submissions')
  submit(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() body: SubmitWorkBody,
  ): Promise<TaskDetailModel> {
    return this.tasksService.submit(user, { taskId: id, urls: body.urls, comment: body.comment })
  }

  @Post('tasks/:id/changes')
  requestChanges(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() body: RequestChangesBody,
  ): Promise<TaskDetailModel> {
    return this.tasksService.requestChanges(user, { taskId: id, comment: body.comment })
  }

  @Post('tasks/:id/acceptance')
  accept(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() body: AcceptTaskBody,
  ): Promise<TaskDetailModel> {
    return this.tasksService.accept(user, { taskId: id, comment: body.comment })
  }

  @Post('tasks/:id/ai-usage')
  addAiUsage(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() body: AddAiUsageBody,
  ): Promise<TaskDetailModel> {
    return this.tasksService.addAiUsage(user, {
      taskId: id,
      serviceId: body.serviceId,
      credits: body.credits,
      note: body.note,
    })
  }
}
