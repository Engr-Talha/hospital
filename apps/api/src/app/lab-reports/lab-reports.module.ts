import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeCatalogModule } from '../fee-catalog/fee-catalog.module';
import { AdminLabReportTemplatesController } from './admin-lab-report-templates.controller';
import { LabReportRecordEntity } from './lab-report-record.entity';
import { LabReportTemplateEntity } from './lab-report-template.entity';
import { LabReportsController } from './lab-reports.controller';
import { LabReportsService } from './lab-reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LabReportTemplateEntity, LabReportRecordEntity]),
    FeeCatalogModule,
  ],
  controllers: [LabReportsController, AdminLabReportTemplatesController],
  providers: [LabReportsService],
})
export class LabReportsModule implements OnModuleInit {
  constructor(private readonly labReports: LabReportsService) {}

  async onModuleInit(): Promise<void> {
    await this.labReports.ensureSeedTemplates();
    await this.labReports.migrateTemplatesToRichEditor();
  }
}
