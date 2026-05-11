import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabReportRecordEntity } from '../lab-reports/lab-report-record.entity';
import { LabReportTemplateEntity } from '../lab-reports/lab-report-template.entity';
import { PatientFeeLineEntity } from '../patient-fees/patient-fee-line.entity';
import { FinancialReportsController } from './financial-reports.controller';
import { FinancialReportsService } from './financial-reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PatientFeeLineEntity,
      LabReportRecordEntity,
      LabReportTemplateEntity,
    ]),
  ],
  controllers: [FinancialReportsController],
  providers: [FinancialReportsService],
})
export class FinancialReportsModule {}
