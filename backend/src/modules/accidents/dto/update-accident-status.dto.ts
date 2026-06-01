import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { AccidentStatus } from '../../../database/entities';

export class UpdateAccidentStatusDto {
  @IsNotEmpty()
  @IsString()
  status: AccidentStatus;

  @IsOptional()
  @IsString()
  remark?: string;
}
