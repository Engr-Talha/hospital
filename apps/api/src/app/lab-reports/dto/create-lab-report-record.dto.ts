import { IsObject, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateLabReportRecordBodyDto {
  @IsUUID()
  templateId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  patientMrn!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  patientName!: string;

  @IsObject()
  fieldValues!: Record<string, string>;
}
