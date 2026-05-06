import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrialManagePatchDto } from './dto/trial-manage.dto';
import { TrialSettingsEntity } from './trial-settings.entity';

export type TrialPublicStatus = {
  trialEnabled: boolean;
  expired: boolean;
  endsAt: string | null;
  serverNow: string;
  msRemaining: number;
};

const ROW_ID = 'default';

@Injectable()
export class TrialService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(TrialSettingsEntity)
    private readonly repo: Repository<TrialSettingsEntity>,
  ) {}

  isTrialModeEnabled(): boolean {
    return this.config.get<string>('TRIAL_MODE', 'false').toLowerCase() === 'true';
  }

  private trialDaysDefault(): number {
    return parseInt(this.config.get<string>('TRIAL_DAYS', '5'), 10) || 5;
  }

  async ensureDefaultRow(): Promise<void> {
    if (!this.isTrialModeEnabled()) return;
    const existing = await this.repo.findOne({ where: { id: ROW_ID } });
    if (existing) return;
    const ends = new Date();
    ends.setDate(ends.getDate() + this.trialDaysDefault());
    ends.setHours(23, 59, 59, 999);
    await this.repo.save(
      this.repo.create({
        id: ROW_ID,
        trialEndsAt: ends,
      }),
    );
  }

  async getEndsAt(): Promise<Date | null> {
    if (!this.isTrialModeEnabled()) return null;
    await this.ensureDefaultRow();
    const row = await this.repo.findOne({ where: { id: ROW_ID } });
    return row?.trialEndsAt ?? null;
  }

  async isExpired(): Promise<boolean> {
    const ends = await this.getEndsAt();
    if (!ends) return false;
    return Date.now() > ends.getTime();
  }

  async getPublicStatus(): Promise<TrialPublicStatus> {
    if (!this.isTrialModeEnabled()) {
      return {
        trialEnabled: false,
        expired: false,
        endsAt: null,
        serverNow: new Date().toISOString(),
        msRemaining: Number.MAX_SAFE_INTEGER,
      };
    }
    const ends = await this.getEndsAt();
    const now = new Date();
    const msRemaining = ends ? Math.max(0, ends.getTime() - now.getTime()) : 0;
    return {
      trialEnabled: true,
      expired: ends ? now.getTime() > ends.getTime() : false,
      endsAt: ends?.toISOString() ?? null,
      serverNow: now.toISOString(),
      msRemaining,
    };
  }

  async setTrialEndsAt(endsAt: Date): Promise<TrialPublicStatus> {
    let row = await this.repo.findOne({ where: { id: ROW_ID } });
    if (!row) {
      row = this.repo.create({ id: ROW_ID, trialEndsAt: endsAt });
    } else {
      row.trialEndsAt = endsAt;
    }
    await this.repo.save(row);
    return this.getPublicStatus();
  }

  async applyManagePatch(dto: TrialManagePatchDto): Promise<TrialPublicStatus> {
    const now = new Date();
    if (dto.trialEndsAt) {
      const d = new Date(dto.trialEndsAt);
      if (Number.isNaN(d.getTime())) {
        throw new BadRequestException('Invalid trialEndsAt');
      }
      return this.setTrialEndsAt(d);
    }
    if (dto.extendDays != null) {
      const base = await this.getEndsAt();
      const from = base && base > now ? base : now;
      const next = new Date(from);
      next.setDate(next.getDate() + dto.extendDays);
      return this.setTrialEndsAt(next);
    }
    return this.getPublicStatus();
  }
}
