import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Role } from '@hospital/shared';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestUser } from '../auth/jwt.strategy';
import { CreateLabReportRecordBodyDto } from './dto/create-lab-report-record.dto';
import { LabReportsService } from './lab-reports.service';

@Controller('lab')
export class LabReportsController {
  constructor(private readonly labReports: LabReportsService) {}

  @Roles(Role.LAB_TECH, Role.ADMIN, Role.DOCTOR)
  @Get('report-templates')
  listTemplates() {
    return this.labReports.listTemplates();
  }

  @Roles(Role.LAB_TECH, Role.ADMIN, Role.DOCTOR)
  @Get('report-templates/:id')
  getTemplate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.labReports.getTemplateForLab(id);
  }

  @Roles(Role.LAB_TECH, Role.ADMIN, Role.DOCTOR)
  @Post('report-records')
  create(
    @Req() req: Request & { user: RequestUser },
    @Body() body: CreateLabReportRecordBodyDto,
  ) {
    return this.labReports.createRecord(req.user.id, body);
  }

  @Roles(Role.LAB_TECH, Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST)
  @Get('report-records')
  listRecords(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('patientMrn') patientMrn?: string,
  ) {
    return this.labReports.listRecords(limit, patientMrn);
  }

  @Roles(Role.LAB_TECH, Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST)
  @Get('report-records/:id')
  getRecord(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.labReports.getRecordDetail(id);
  }
}
