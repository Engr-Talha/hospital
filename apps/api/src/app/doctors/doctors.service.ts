import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import {
  PatientAppointmentDoctor,
  PatientDoctorOption,
  Role,
} from '@hospital/shared';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { DoctorEntity } from './doctor.entity';

@Injectable()
export class DoctorsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(DoctorEntity)
    private readonly doctorsRepo: Repository<DoctorEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async create(input: {
    email: string;
    password: string;
    name: string;
    medicalField: string;
  }): Promise<{
    id: string;
    userId: string;
    email: string;
    name: string;
    role: Role;
    medicalField: string;
    createdAt: Date;
  }> {
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.usersRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    return this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(UserEntity);
      const doctors = manager.getRepository(DoctorEntity);

      const passwordHash = await bcrypt.hash(input.password, 10);
      const user = await users.save(
        users.create({
          email,
          passwordHash,
          name: input.name.trim(),
          role: Role.DOCTOR,
        }),
      );

      const profile = await doctors.save(
        doctors.create({
          userId: user.id,
          medicalField: input.medicalField.trim(),
        }),
      );

      return {
        id: profile.id,
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        medicalField: profile.medicalField,
        createdAt: profile.createdAt,
      };
    });
  }

  async findAllForAdmin(): Promise<
    Array<{
      id: string;
      userId: string;
      email: string;
      name: string;
      role: Role;
      medicalField: string;
      createdAt: Date;
    }>
  > {
    const rows = await this.doctorsRepo.find({
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
    return rows.map((d) => ({
      id: d.id,
      userId: d.userId,
      email: d.user.email,
      name: d.user.name,
      role: d.user.role,
      medicalField: d.medicalField,
      createdAt: d.createdAt,
    }));
  }

  /** Dropdown options when registering a patient (reception). */
  async findRegistrationOptions(): Promise<PatientDoctorOption[]> {
    const rows = await this.doctorsRepo.find({
      relations: ['user'],
    });
    rows.sort((a, b) => a.user.name.localeCompare(b.user.name));
    return rows.map((d) => ({
      userId: d.userId,
      name: d.user.name,
      medicalField: d.medicalField,
      label: `${d.user.name} — ${d.medicalField}`,
    }));
  }

  async getAppointmentSummary(
    userId: string,
  ): Promise<PatientAppointmentDoctor | null> {
    const d = await this.doctorsRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!d) return null;
    return {
      userId: d.userId,
      name: d.user.name,
      medicalField: d.medicalField,
    };
  }

  async assertValidDoctorUserId(userId: string): Promise<void> {
    const ok = await this.doctorsRepo.exist({ where: { userId } });
    if (!ok) {
      throw new BadRequestException('Selected doctor is invalid');
    }
  }

  /**
   * Deletes the doctor profile and login user (by doctor row id).
   * Lab reports that list this user as author are reassigned to `reassignAuthorToUserId`
   * (typically the admin performing the delete).
   */
  async removeByProfileId(
    doctorProfileId: string,
    reassignAuthorToUserId: string,
  ): Promise<void> {
    const doctor = await this.doctorsRepo.findOne({
      where: { id: doctorProfileId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    if (doctor.userId === reassignAuthorToUserId) {
      throw new BadRequestException(
        'Cannot reassign lab report authorship to the user being removed.',
      );
    }
    const actingUser = await this.usersRepo.findOne({
      where: { id: reassignAuthorToUserId },
    });
    if (!actingUser) {
      throw new BadRequestException('Invalid acting user for reassignment');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `UPDATE lab_report_records SET created_by_id = $1 WHERE created_by_id = $2`,
        [reassignAuthorToUserId, doctor.userId],
      );
      await manager.getRepository(UserEntity).delete(doctor.userId);
    });
  }
}
