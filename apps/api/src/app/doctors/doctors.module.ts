import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/user.entity';
import { AdminDoctorsController } from './admin-doctors.controller';
import { DoctorEntity } from './doctor.entity';
import { DoctorsService } from './doctors.service';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorEntity, UserEntity])],
  controllers: [AdminDoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
