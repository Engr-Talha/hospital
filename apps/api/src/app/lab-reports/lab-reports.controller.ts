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
@Roles(Role.LAB_TECH, Role.ADMIN)
export class LabReportsController {
  constructor(private readonly labReports: LabReportsService) {}

  @Get('report-templates')
  listTemplates() {
    return this.labReports.listTemplates();
  }

  @Get('report-templates/:id')
  getTemplate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.labReports.getTemplateForLab(id);
  }

  @Post('report-records')
  create(
    @Req() req: Request & { user: RequestUser },
    @Body() body: CreateLabReportRecordBodyDto,
  ) {
    return this.labReports.createRecord(req.user.id, body);
  }

  @Get('report-records')
  listRecords(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.labReports.listRecords(limit);
  }

  @Get('report-records/:id')
  getRecord(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.labReports.getRecordDetail(id);
  }
}
