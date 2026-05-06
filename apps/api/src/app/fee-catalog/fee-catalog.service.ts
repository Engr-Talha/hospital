import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FeeCatalogItem } from '@hospital/shared';
import { Repository } from 'typeorm';
import { FeeCatalogItemEntity } from './fee-catalog-item.entity';
import { CreateFeeCatalogItemDto } from './dto/create-fee-catalog-item.dto';
import { UpdateFeeCatalogItemDto } from './dto/update-fee-catalog-item.dto';

@Injectable()
export class FeeCatalogService {
  constructor(
    @InjectRepository(FeeCatalogItemEntity)
    private readonly repo: Repository<FeeCatalogItemEntity>,
  ) {}

  private toDto(row: FeeCatalogItemEntity): FeeCatalogItem {
    return {
      id: row.id,
      name: row.name,
      defaultPrice: row.defaultPrice,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private money(n: number): string {
    return (Math.round(n * 100) / 100).toFixed(2);
  }

  async seedDefaults(): Promise<void> {
    const seeds = [
      { name: 'X-Ray', defaultPrice: 500, sortOrder: 10 },
      { name: 'Ultrasound', defaultPrice: 1200, sortOrder: 20 },
      { name: 'ECG', defaultPrice: 350, sortOrder: 30 },
      { name: 'Lab — CBC', defaultPrice: 800, sortOrder: 40 },
      { name: 'Lab — LFT', defaultPrice: 950, sortOrder: 50 },
      { name: 'Radiology consultation', defaultPrice: 1500, sortOrder: 60 },
    ];
    const count = await this.repo.count();
    if (count > 0) return;
    for (const s of seeds) {
      await this.repo.save(
        this.repo.create({
          name: s.name,
          defaultPrice: this.money(s.defaultPrice),
          isActive: true,
          sortOrder: s.sortOrder,
        }),
      );
    }
  }

  findActive(): Promise<FeeCatalogItem[]> {
    return this.repo
      .find({
        where: { isActive: true },
        order: { sortOrder: 'ASC', name: 'ASC' },
      })
      .then((rows) => rows.map((r) => this.toDto(r)));
  }

  findAllAdmin(): Promise<FeeCatalogItem[]> {
    return this.repo
      .find({ order: { sortOrder: 'ASC', name: 'ASC' } })
      .then((rows) => rows.map((r) => this.toDto(r)));
  }

  async findOneEntity(id: string): Promise<FeeCatalogItemEntity> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Fee item not found');
    return row;
  }

  async create(dto: CreateFeeCatalogItemDto): Promise<FeeCatalogItem> {
    const row = this.repo.create({
      name: dto.name.trim(),
      defaultPrice: this.money(dto.defaultPrice),
      isActive: true,
      sortOrder: dto.sortOrder ?? 0,
    });
    const saved = await this.repo.save(row);
    return this.toDto(saved);
  }

  async update(id: string, dto: UpdateFeeCatalogItemDto): Promise<FeeCatalogItem> {
    const row = await this.findOneEntity(id);
    if (dto.name !== undefined) row.name = dto.name.trim();
    if (dto.defaultPrice !== undefined)
      row.defaultPrice = this.money(dto.defaultPrice);
    if (dto.isActive !== undefined) row.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder;
    const saved = await this.repo.save(row);
    return this.toDto(saved);
  }

  async remove(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }
}
