import { Body, Controller, Get, Post } from '@nestjs/common';
import { Role } from '@hospital/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UsersService } from './users.service';

@Controller('admin/users')
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() body: CreateStaffUserDto) {
    return this.usersService.createStaffUser(body);
  }
}
