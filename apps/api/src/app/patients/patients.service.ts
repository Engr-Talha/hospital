import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreatePatientDto,
  PaginatedPatients,
  Patient,
  PatientRegisteredBySummary,
} from '@hospital/shared';
import { Repository } from 'typeorm';
import { PatientEntity } from './patient.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(PatientEntity)
    private readonly repo: Repository<PatientEntity>,
  ) {}

  private toDto(entity: PatientEntity): Patient {
    let registeredBy: PatientRegisteredBySummary | null = null;
    if (entity.registeredByUser) {
      const u = entity.registeredByUser;
      registeredBy = {
        id: u.id,
        name: u.name,
        email: u.email,
      };
    }
    const dob =
      typeof entity.dob === 'string'
        ? entity.dob
        : (entity.dob as Date).toISOString().slice(0, 10);
    return {
      id: entity.id,
      mrn: entity.mrn,
      firstName: entity.firstName,
      lastName: entity.lastName,
      gender: entity.gender,
      dob,
      phone: entity.phone,
      address: entity.address,
      bloodGroup: entity.bloodGroup,
      emergencyContactName: entity.emergencyContactName,
      emergencyContactPhone: entity.emergencyContactPhone,
      notes: entity.notes,
      registeredBy,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  private async nextMrn(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `MRN-${year}-`;
    const last = await this.repo
      .createQueryBuilder('p')
      .where('p.mrn LIKE :pre', { pre: `${prefix}%` })
      .orderBy('p.mrn', 'DESC')
      .getOne();
    let seq = 1;
    if (last?.mrn) {
      const part = last.mrn.split('-')[2];
      const n = part ? parseInt(part, 10) : 0;
      if (!Number.isNaN(n)) seq = n + 1;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  async create(
    dto: CreatePatientDto,
    registeredById: string,
  ): Promise<Patient> {
    const mrn = await this.nextMrn();
    const row = this.repo.create({
      mrn,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      gender: dto.gender,
      dob: dto.dob.slice(0, 10),
      phone: dto.phone?.trim() || null,
      address: dto.address?.trim() || null,
      bloodGroup: dto.bloodGroup ?? null,
      emergencyContactName: dto.emergencyContactName?.trim() || null,
      emergencyContactPhone: dto.emergencyContactPhone?.trim() || null,
      notes: dto.notes?.trim() || null,
      registeredById,
    });
    const saved = await this.repo.save(row);
    return this.findOne(saved.id);
  }

  async findAll(params: {
    search?: string;
    page: number;
    limit: number;
  }): Promise<PaginatedPatients> {
    const { search, page, limit } = params;
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.registeredByUser', 'u')
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search?.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(p.firstName) LIKE :t OR LOWER(p.lastName) LIKE :t OR LOWER(p.mrn) LIKE :t OR LOWER(COALESCE(p.phone, \'\')) LIKE :t)',
        { t: term },
      );
    }
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((i) => this.toDto(i)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Patient> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: { registeredByUser: true },
    });
    if (!entity) throw new NotFoundException('Patient not found');
    return this.toDto(entity);
  }

  async update(
    id: string,
    patch: Partial<CreatePatientDto>,
  ): Promise<Patient> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Patient not found');
    if (patch.firstName !== undefined)
      entity.firstName = patch.firstName.trim();
    if (patch.lastName !== undefined) entity.lastName = patch.lastName.trim();
    if (patch.gender !== undefined) entity.gender = patch.gender;
    if (patch.dob !== undefined) entity.dob = patch.dob.slice(0, 10);
    if (patch.phone !== undefined)
      entity.phone = patch.phone?.trim() || null;
    if (patch.address !== undefined)
      entity.address = patch.address?.trim() || null;
    if (patch.bloodGroup !== undefined) entity.bloodGroup = patch.bloodGroup;
    if (patch.emergencyContactName !== undefined)
      entity.emergencyContactName = patch.emergencyContactName?.trim() || null;
    if (patch.emergencyContactPhone !== undefined)
      entity.emergencyContactPhone =
        patch.emergencyContactPhone?.trim() || null;
    if (patch.notes !== undefined) entity.notes = patch.notes?.trim() || null;
    await this.repo.save(entity);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete({ id });
    if (!res.affected) throw new NotFoundException('Patient not found');
  }
}
