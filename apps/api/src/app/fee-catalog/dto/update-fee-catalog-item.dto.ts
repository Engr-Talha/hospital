import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateFeeCatalogItemDto } from './create-fee-catalog-item.dto';

export class UpdateFeeCatalogItemDto extends PartialType(
  CreateFeeCatalogItemDto,
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
