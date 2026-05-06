import { PartialType } from '@nestjs/mapped-types';
import { CreatePatientBodyDto } from './create-patient.dto';

export class UpdatePatientBodyDto extends PartialType(CreatePatientBodyDto) {}
