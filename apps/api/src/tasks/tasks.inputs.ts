import { CreativeType, Priority } from '@prisma/client'
import { Type } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsDate, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator'

export class CreateTaskInput {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  offer!: string

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  geo!: string

  @IsEnum(CreativeType)
  creativeType!: CreativeType

  @IsInt()
  @Min(1)
  quantity!: number

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  description!: string

  @IsString({ each: true })
  @ArrayMaxSize(10)
  @MaxLength(2000, { each: true })
  referenceUrls!: string[]

  @IsEnum(Priority)
  priority!: Priority

  @Type(() => Date)
  @IsDate()
  deadline!: Date
}

export class SubmitWorkBody {
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @MaxLength(2000, { each: true })
  urls!: string[]

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string | null
}

export type SubmitWorkInput = SubmitWorkBody & { taskId: string }

export class RequestChangesBody {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  comment!: string
}

export type RequestChangesInput = RequestChangesBody & { taskId: string }

export class AcceptTaskBody {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string | null
}

export type AcceptTaskInput = AcceptTaskBody & { taskId: string }

export class AddAiUsageBody {
  @IsString()
  serviceId!: string

  @IsInt()
  @Min(1)
  @Max(1_000_000)
  credits!: number

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string | null
}

export type AddAiUsageInput = AddAiUsageBody & { taskId: string }
