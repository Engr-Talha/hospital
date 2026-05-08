import { LabReportTemplateEntity } from './lab-report-template.entity';
import { UserEntity } from '../users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'lab_report_records' })
export class LabReportRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => LabReportTemplateEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'template_id' })
  template!: LabReportTemplateEntity;

  @Column({ name: 'patient_mrn' })
  patientMrn!: string;

  @Column({ name: 'patient_name' })
  patientName!: string;

  @Column({ name: 'field_values', type: 'jsonb' })
  fieldValues!: Record<string, string>;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: UserEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
