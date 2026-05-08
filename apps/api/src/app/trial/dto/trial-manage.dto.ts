import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class TrialManagePatchDto {
  @IsOptional()
  @IsDateString()
  trialEndsAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  extendDays?: number;
}
