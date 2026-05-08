import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '@hospital/shared';
import { UserEntity } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepo.findOne({ where: { email: email.toLowerCase() } });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findAll(): Promise<UserEntity[]> {
    return this.usersRepo.find({
      order: { createdAt: 'ASC' },
      select: ['id', 'email', 'name', 'role', 'createdAt'],
    });
  }

  async createStaffUser(input: {
    email: string;
    password: string;
    name: string;
    role: Role;
  }): Promise<{
    id: string;
    email: string;
    name: string;
    role: Role;
    createdAt: Date;
  }> {
    if (input.role === Role.DOCTOR) {
      throw new BadRequestException(
        'Doctor accounts must be created under Admin → Doctors (includes medical field).',
      );
    }
    const email = input.email.trim().toLowerCase();
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    const saved = await this.usersRepo.save(
      this.usersRepo.create({
        email,
        passwordHash,
        name: input.name.trim(),
        role: input.role,
      }),
    );
    return {
      id: saved.id,
      email: saved.email,
      name: saved.name,
      role: saved.role,
      createdAt: saved.createdAt,
    };
  }

  async ensureSeedUsers(): Promise<void> {
    const seeds: Array<{
      email: string;
      password: string;
      name: string;
      role: Role;
    }> = [
      {
        email: 'admin@hospital.local',
        password: 'admin123',
        name: 'System Admin',
        role: Role.ADMIN,
      },
      {
        email: 'reception@hospital.local',
        password: 'recept123',
        name: 'Front Desk',
        role: Role.RECEPTIONIST,
      },
      {
        email: 'lab@hospital.local',
        password: 'lab12345',
        name: 'Lab Technician',
        role: Role.LAB_TECH,
      },
    ];

    for (const s of seeds) {
      const existing = await this.findByEmail(s.email);
      if (existing) continue;
      const passwordHash = await bcrypt.hash(s.password, 10);
      await this.usersRepo.save(
        this.usersRepo.create({
          email: s.email.toLowerCase(),
          passwordHash,
          name: s.name,
          role: s.role,
        }),
      );
    }
  }

  async validatePassword(
    user: UserEntity,
    plainPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, user.passwordHash);
  }
}
