import { Controller, Get, Req } from '@nestjs/common';
import { Role } from '@hospital/shared';
import { Request } from 'express';
import { RequestUser } from '../auth/jwt.strategy';
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

  @Roles(Role.ADMIN)
  @Get('receptionists')
  receptionists() {
    return this.dashboardService.getReceptionistPerformance();
  }

  @Roles(Role.RECEPTIONIST)
  @Get('reception-desk')
  receptionDesk(@Req() req: Request & { user: RequestUser }) {
    return this.dashboardService.getReceptionDesk(req.user.id);
  }

  @Roles(Role.LAB_TECH, Role.ADMIN, Role.DOCTOR)
  @Get('lab-bench')
  labBench() {
    return this.dashboardService.getLabBench();
  }
}
