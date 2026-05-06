import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePatientFeeLineDto {
  @IsOptional()
  @IsUUID()
  catalogItemId?: string;

  @IsOptional()
  @IsString()
  customDescription?: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}
