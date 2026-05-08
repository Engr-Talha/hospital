import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeCatalogModule } from '../fee-catalog/fee-catalog.module';
import { PatientsModule } from '../patients/patients.module';
import { PatientEntity } from '../patients/patient.entity';
import { PatientFeeLineEntity } from './patient-fee-line.entity';
import { PatientFeesController } from './patient-fees.controller';
import { PatientFeesService } from './patient-fees.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PatientFeeLineEntity, PatientEntity]),
    FeeCatalogModule,
    PatientsModule,
  ],
  controllers: [PatientFeesController],
  providers: [PatientFeesService],
  exports: [PatientFeesService],
})
export class PatientFeesModule {}
