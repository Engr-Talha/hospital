import { FeeCatalogItemEntity } from '../fee-catalog/fee-catalog-item.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type LabReportFieldSchemaRow = {
  key: string;
  label: string;
  type: 'text' | 'textarea';
};

@Entity({ name: 'lab_report_templates' })
export class LabReportTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column()
  title!: string;

  @ManyToOne(() => FeeCatalogItemEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'fee_catalog_item_id' })
  feeCatalogItem!: FeeCatalogItemEntity | null;

  @Column({ name: 'fields_schema', type: 'jsonb' })
  fieldsSchema!: LabReportFieldSchemaRow[];

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
