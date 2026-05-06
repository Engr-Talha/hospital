import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { Role, UpdateLabReportTemplateDto } from '@hospital/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateLabReportTemplateBodyDto } from './dto/update-lab-report-template.dto';
import { LabReportsService } from './lab-reports.service';

@Controller('admin/lab-report-templates')
@Roles(Role.ADMIN)
export class AdminLabReportTemplatesController {
  constructor(private readonly labReports: LabReportsService) {}

  @Get()
  list() {
    return this.labReports.listTemplatesAdmin();
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateLabReportTemplateBodyDto,
  ) {
    const dto: UpdateLabReportTemplateDto = {
      feeCatalogItemId: body.feeCatalogItemId,
      isActive: body.isActive,
    };
    return this.labReports.updateTemplateAdmin(id, dto);
  }
}
