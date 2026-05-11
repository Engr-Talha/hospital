import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { RevenueReportGroupBy, Role } from '@hospital/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { FinancialReportsService } from './financial-reports.service';

@Controller('admin/revenue-report')
export class FinancialReportsController {
  constructor(private readonly financialReports: FinancialReportsService) {}

  @Roles(Role.ADMIN)
  @Get()
  report(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('groupBy') groupBy: RevenueReportGroupBy = 'day',
  ) {
    if (!from?.trim() || !to?.trim()) {
      throw new BadRequestException('Query parameters "from" and "to" are required (YYYY-MM-DD).');
    }
    const g =
      groupBy === 'week' || groupBy === 'month' ? groupBy : 'day';
    return this.financialReports.getRevenueReport(from.trim(), to.trim(), g);
  }
}
