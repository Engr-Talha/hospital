import { Controller, Get } from '@nestjs/common';
import { Role } from '@hospital/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { FeeCatalogService } from './fee-catalog.service';

@Controller('fee-catalog')
export class FeeCatalogController {
  constructor(private readonly feeCatalogService: FeeCatalogService) {}

  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.LAB_TECH)
  @Get()
  listActive() {
    return this.feeCatalogService.findActive();
  }
}
