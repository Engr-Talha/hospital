import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role } from '@hospital/shared';
import { RequestUser } from '../auth/jwt.strategy';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateDoctorBodyDto } from './dto/create-doctor.dto';
import { DoctorsService } from './doctors.service';

@Controller('admin/doctors')
@Roles(Role.ADMIN)
export class AdminDoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  list() {
    return this.doctorsService.findAllForAdmin();
  }

  @Post()
  create(@Body() body: CreateDoctorBodyDto) {
    return this.doctorsService.create(body);
  }

  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request & { user: RequestUser },
  ) {
    return this.doctorsService.removeByProfileId(id, req.user.id);
  }
}
