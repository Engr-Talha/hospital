import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@hospital/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreateFeeCatalogItemDto } from './dto/create-fee-catalog-item.dto';
import { UpdateFeeCatalogItemDto } from './dto/update-fee-catalog-item.dto';
import { FeeCatalogService } from './fee-catalog.service';

@Controller('admin/fee-catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminFeeCatalogController {
  constructor(private readonly feeCatalogService: FeeCatalogService) {}

  @Get()
  listAll() {
    return this.feeCatalogService.findAllAdmin();
  }

  @Post()
  create(@Body() dto: CreateFeeCatalogItemDto) {
    return this.feeCatalogService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateFeeCatalogItemDto,
  ) {
    return this.feeCatalogService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.feeCatalogService.remove(id);
  }
}
