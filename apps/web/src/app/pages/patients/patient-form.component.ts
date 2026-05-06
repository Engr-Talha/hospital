import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { BloodGroup, CreatePatientDto, Gender } from '@hospital/shared';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
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
  ],
  templateUrl: './patient-form.component.html',
  styleUrl: './patient-form.component.scss',
})
export class PatientFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly patientsApi = inject(PatientsService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  readonly genders = Object.values(Gender);
  readonly bloodGroups = Object.values(BloodGroup);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    gender: [Gender.MALE, Validators.required],
    dob: ['', Validators.required],
    phone: [''],
    address: [''],
    bloodGroup: [''],
    emergencyContactName: [''],
    emergencyContactPhone: [''],
    notes: [''],
  });

  saving = false;

  cancel(): void {
    void this.router.navigate(['/patients']);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const bloodRaw = raw.bloodGroup?.trim();
    const blood =
      bloodRaw && bloodRaw.length > 0
        ? (bloodRaw as BloodGroup)
        : undefined;
    const body: CreatePatientDto = {
      firstName: raw.firstName,
      lastName: raw.lastName,
      gender: raw.gender,
      dob: raw.dob,
      phone: raw.phone || undefined,
      address: raw.address || undefined,
      bloodGroup: blood,
      emergencyContactName: raw.emergencyContactName || undefined,
      emergencyContactPhone: raw.emergencyContactPhone || undefined,
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
