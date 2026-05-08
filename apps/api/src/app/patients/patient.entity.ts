import { BloodGroup, Gender } from '@hospital/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';

@Entity({ name: 'patients' })
export class PatientEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  mrn!: string;

  @Column({ name: 'first_name' })
  firstName!: string;

  @Column({ name: 'last_name' })
  lastName!: string;

  @Column({ type: 'varchar', length: 16 })
  gender!: Gender;

  @Column({ type: 'int' })
  age!: number;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ name: 'blood_group', type: 'varchar', length: 16, nullable: true })
  bloodGroup!: BloodGroup | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'appointment_doctor_id', type: 'uuid', nullable: true })
  appointmentDoctorId!: string | null;

  @ManyToOne(() => UserEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'appointment_doctor_id' })
  appointmentDoctor!: UserEntity | null;

  @Column({ name: 'registered_by_id', type: 'uuid', nullable: true })
  registeredById!: string | null;

  @ManyToOne(() => UserEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'registered_by_id' })
  registeredByUser!: UserEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
