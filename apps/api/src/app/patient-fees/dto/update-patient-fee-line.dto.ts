import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdatePatientFeeLineDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string;
}
