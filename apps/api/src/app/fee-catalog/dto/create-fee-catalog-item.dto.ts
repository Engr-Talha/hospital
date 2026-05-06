import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateFeeCatalogItemDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsNumber()
  @Min(0)
  defaultPrice!: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
