import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientFeeLineEntity } from '../patient-fees/patient-fee-line.entity';
import { PatientEntity } from '../patients/patient.entity';
import { UserEntity } from '../users/user.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PatientEntity,
      PatientFeeLineEntity,
      UserEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
