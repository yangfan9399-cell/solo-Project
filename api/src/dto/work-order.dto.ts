import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, ArrayMinSize } from 'class-validator'
import { Type } from 'class-transformer'
import { FaultSource, FaultType } from '../entities/work-order.entity.js'

export class CreateWorkOrderDto {
  @IsEnum(FaultSource)
  faultSource: FaultSource

  @IsEnum(FaultType)
  faultType: FaultType

  @IsString()
  deviceId: string

  @IsString()
  deviceNo: string

  @IsString()
  stationId: string

  @IsString()
  stationName: string

  @IsBoolean()
  @IsOptional()
  isRepeat?: boolean

  @IsNumber()
  @IsOptional()
  repeatCount?: number

  @IsString()
  createdBy: string
}

export class AssignWorkOrderDto {
  @IsString()
  assigneeId: string

  @IsString()
  assigneeName: string
}

export class RepairWorkOrderDto {
  @IsString()
  repairType: 'remote_recovery' | 'on_site_repair'

  @IsString()
  repairNote: string

  @IsNumber()
  repairDuration: number

  @IsString()
  operator: string
}

export class DisputedPartItemDto {
  @IsString()
  feeId: string

  @IsString()
  disputeReason: string
}

export class DisputeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => DisputedPartItemDto)
  disputedParts: DisputedPartItemDto[]

  @IsString()
  operator: string
}

export class AdjustFeeDto {
  @IsString()
  feeId: string

  @IsNumber()
  adjustedPrice: number

  @IsString()
  adjustmentReason: string

  @IsString()
  operator: string
}

export class CreatePartsFeeDto {
  @IsString()
  orderId: string

  @IsString()
  partName: string

  @IsNumber()
  quantity: number

  @IsNumber()
  unitPrice: number

  @IsBoolean()
  @IsOptional()
  isDisputed?: boolean

  @IsString()
  @IsOptional()
  disputeReason?: string
}
