import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'trial_settings' })
export class TrialSettingsEntity {
  @PrimaryColumn({ type: 'varchar', length: 32, default: 'default' })
  id!: string;

  @Column({ name: 'trial_ends_at', type: 'timestamptz' })
  trialEndsAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
