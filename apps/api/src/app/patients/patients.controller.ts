import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Role } from '@hospital/shared';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestUser } from '../auth/jwt.strategy';
import { CreatePatientBodyDto } from './dto/create-patient.dto';
import { UpdatePatientBodyDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Post()
  create(
    @Req() req: Request & { user: RequestUser },
    @Body() body: CreatePatientBodyDto,
  ) {
    return this.patientsService.create(body, req.user.id);
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.LAB_TECH)
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    return this.patientsService.findAll({
      search,
      page: safePage,
      limit: safeLimit,
    });
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.LAB_TECH)
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.patientsService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdatePatientBodyDto,
  ) {
    return this.patientsService.update(id, body);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.patientsService.remove(id);
  }
}
