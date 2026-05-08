import { Body, Controller, Get, Post } from '@nestjs/common';
import { Role } from '@hospital/shared';
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
}
