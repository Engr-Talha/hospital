import { IsBoolean, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class UpdateLabReportTemplateBodyDto {
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsUUID()
  feeCatalogItemId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
