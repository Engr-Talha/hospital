import { BloodGroup, Gender } from '@hospital/shared';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePatientBodyDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsEnum(Gender)
  gender!: Gender;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(130)
  age!: number;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsUUID()
  appointmentDoctorId!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @IsOptional()
  @IsString()
  notes?: string;
}
