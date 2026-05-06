import { Controller, Get } from '@nestjs/common';
import { Role } from '@hospital/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles(Role.ADMIN)
  @Get('overview')
  overview() {
    return this.dashboardService.getOverview();
  }

  @Roles(Role.RECEPTIONIST)
  @Get('reception-desk')
  receptionDesk() {
    return this.dashboardService.getReceptionDesk();
  }

  @Roles(Role.LAB_TECH, Role.ADMIN)
  @Get('lab-bench')
  labBench() {
    return this.dashboardService.getLabBench();
  }
}
