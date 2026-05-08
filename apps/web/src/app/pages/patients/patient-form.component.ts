import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  BloodGroup,
  CreatePatientDto,
  Gender,
  PatientDoctorOption,
} from '@hospital/shared';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { PatientsService } from '../../core/patients.service';

@Component({
  selector: 'app-patient-form',
  imports: [
    ReactiveFormsModule,
    Card,
    InputText,
    Textarea,
    Button,
    Toast,
    Select,
    Message,
  ],
  templateUrl: './patient-form.component.html',
  styleUrl: './patient-form.component.scss',
})
export class PatientFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly patientsApi = inject(PatientsService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  readonly genders = Object.values(Gender);
  readonly bloodGroups = Object.values(BloodGroup);
  readonly doctorOptions = signal<PatientDoctorOption[]>([]);

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    gender: [Gender.MALE, Validators.required],
    age: [
      null as number | null,
      [Validators.required, Validators.min(0), Validators.max(130)],
    ],
    appointmentDoctorId: ['', Validators.required],
    phone: [''],
    address: [''],
    bloodGroup: [''],
    notes: [''],
  });

  saving = false;

  ngOnInit(): void {
    this.patientsApi.doctorOptions().subscribe({
      next: (opts) => this.doctorOptions.set(opts),
      error: () => this.doctorOptions.set([]),
    });
  }

  cancel(): void {
    void this.router.navigate(['/patients']);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (this.doctorOptions().length === 0) {
      this.messages.add({
        severity: 'warn',
        summary: 'No doctors available',
        detail: 'Register doctors under Admin → Doctors before registering patients.',
      });
      return;
    }
    const raw = this.form.getRawValue();
    const ageNum = Math.round(Number(raw.age));
    if (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 130) {
      this.messages.add({
        severity: 'warn',
        summary: 'Invalid age',
        detail: 'Enter age as a whole number from 0 to 130.',
      });
      return;
    }
    const bloodRaw = raw.bloodGroup?.trim();
    const blood =
      bloodRaw && bloodRaw.length > 0
        ? (bloodRaw as BloodGroup)
        : undefined;
    const body: CreatePatientDto = {
      firstName: raw.firstName!,
      lastName: raw.lastName!,
      gender: raw.gender!,
      age: ageNum,
      appointmentDoctorId: raw.appointmentDoctorId!,
      phone: raw.phone || undefined,
      address: raw.address || undefined,
      bloodGroup: blood,
      notes: raw.notes || undefined,
    };
    this.saving = true;
    this.patientsApi.create(body).subscribe({
      next: (p) => {
        this.saving = false;
        void this.router.navigate(['/patients', p.id]);
      },
      error: () => {
        this.saving = false;
        this.messages.add({
          severity: 'error',
          summary: 'Could not register patient',
          detail: 'Check required fields and try again.',
        });
      },
    });
  }
}
