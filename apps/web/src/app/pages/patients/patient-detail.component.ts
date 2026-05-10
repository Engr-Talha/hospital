import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  BloodGroup,
  CreatePatientFeeLineDto,
  FeeCatalogItem,
  Gender,
  LabReportRecordSummary,
  LabReportTemplateSummary,
  Patient,
  PatientDoctorOption,
  PatientFeeLine,
  Permission,
  Role,
  UpdatePatientDto,
  UpdatePatientFeeLineDto,
} from '@hospital/shared';
import { forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { Divider } from 'primeng/divider';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { ProgressSpinner } from 'primeng/progressspinner';
import { AuthService } from '../../core/auth.service';
import { FeeCatalogService } from '../../core/fee-catalog.service';
import { LabReportsApiService } from '../../core/lab-reports-api.service';
import { PatientFeesService } from '../../core/patient-fees.service';
import { PatientsService } from '../../core/patients.service';

@Component({
  selector: 'app-patient-detail',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    Card,
    Button,
    RouterLink,
    Tag,
    Divider,
    Toast,
    TableModule,
    Dialog,
    InputText,
    InputNumber,
    Select,
    Textarea,
    Message,
    ProgressSpinner,
  ],
  templateUrl: './patient-detail.component.html',
  styleUrl: './patient-detail.component.scss',
})
export class PatientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly patientsApi = inject(PatientsService);
  private readonly feesApi = inject(PatientFeesService);
  private readonly feeCatalogApi = inject(FeeCatalogService);
  private readonly labApi = inject(LabReportsApiService);
  readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);

  readonly patient = signal<Patient | null>(null);
  readonly feeLines = signal<PatientFeeLine[]>([]);
  readonly catalogItems = signal<FeeCatalogItem[]>([]);
  readonly labTemplates = signal<LabReportTemplateSummary[]>([]);
  readonly labRecords = signal<LabReportRecordSummary[]>([]);
  readonly labLoading = signal(false);
  readonly Permission = Permission;
  readonly Role = Role;
  readonly genders = Object.values(Gender);
  readonly bloodGroups = Object.values(BloodGroup);
  readonly doctorOptionsForEdit = signal<PatientDoctorOption[]>([]);

  patientEditDialog = false;
  savingPatientEdit = false;

  readonly editPatientForm = this.fb.group({
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

  readonly showPatientLabSection = computed(() => {
    const r = this.auth.user()?.role;
    return (
      r === Role.DOCTOR ||
      r === Role.RECEPTIONIST ||
      r === Role.ADMIN
    );
  });

  readonly canCreateLabReports = computed(() => {
    const r = this.auth.user()?.role;
    return r === Role.DOCTOR || r === Role.LAB_TECH || r === Role.ADMIN;
  });

  addDialog = false;
  addMode: 'catalog' | 'custom' = 'catalog';
  selCatalogId = '';
  customDesc = '';
  qty = 1;
  unitPrice = 0;

  editDialog = false;
  readonly editingLine = signal<PatientFeeLine | null>(null);
  editQty = 1;
  editUnitPrice = 0;
  editDesc = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.patientsApi.get(id).subscribe({
      next: (p) => {
        this.patient.set(p);
        const ur = this.auth.user()?.role;
        if (
          ur === Role.DOCTOR ||
          ur === Role.RECEPTIONIST ||
          ur === Role.ADMIN
        ) {
          this.loadLabSection(p);
        }
        if (ur !== Role.DOCTOR && this.auth.hasPermission(Permission.PATIENT_VIEW)) {
          this.loadFees(id);
        }
      },
      error: () => void this.router.navigate(['/patients']),
    });
  }

  patientDisplayName(p: Patient): string {
    return `${p.firstName} ${p.lastName}`.trim();
  }

  openEditPatient(): void {
    const p = this.patient();
    if (!p) return;
    this.patientsApi.doctorOptions().subscribe({
      next: (opts) => {
        this.doctorOptionsForEdit.set(opts);
        this.editPatientForm.patchValue({
          firstName: p.firstName,
          lastName: p.lastName,
          gender: p.gender,
          age: p.age,
          appointmentDoctorId: p.appointmentDoctor?.userId ?? '',
          phone: p.phone ?? '',
          address: p.address ?? '',
          bloodGroup: p.bloodGroup ?? '',
          notes: p.notes ?? '',
        });
        this.patientEditDialog = true;
      },
      error: () =>
        this.messages.add({
          severity: 'error',
          summary: 'Could not load doctors',
          detail: 'Try again or ask an admin to check doctor accounts.',
        }),
    });
  }

  savePatientEdit(): void {
    const p = this.patient();
    if (!p) return;
    this.editPatientForm.markAllAsTouched();
    if (this.editPatientForm.invalid) return;
    if (this.doctorOptionsForEdit().length === 0) {
      this.messages.add({
        severity: 'warn',
        summary: 'No doctors available',
        detail: 'Register doctors under Admin → Doctors first.',
      });
      return;
    }
    const raw = this.editPatientForm.getRawValue();
    const ageNum = Math.round(Number(raw.age));
    if (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 130) {
      this.messages.add({
        severity: 'warn',
        summary: 'Invalid age',
        detail: 'Enter age as a whole number from 0 to 130.',
      });
      return;
    }
    const docId = raw.appointmentDoctorId?.trim();
    if (!docId) {
      this.messages.add({
        severity: 'warn',
        summary: 'Appointment doctor required',
        detail: 'Select the appointment doctor.',
      });
      return;
    }
    const bloodRaw = raw.bloodGroup?.trim();
    const blood =
      bloodRaw && bloodRaw.length > 0
        ? (bloodRaw as BloodGroup)
        : undefined;
    const body: UpdatePatientDto = {
      firstName: raw.firstName!.trim(),
      lastName: raw.lastName!.trim(),
      gender: raw.gender!,
      age: ageNum,
      appointmentDoctorId: docId,
      phone: raw.phone?.trim() || undefined,
      address: raw.address?.trim() || undefined,
      bloodGroup: blood,
      notes: raw.notes?.trim() || undefined,
    };
    this.savingPatientEdit = true;
    this.patientsApi.update(p.id, body).subscribe({
      next: (updated) => {
        this.savingPatientEdit = false;
        this.patient.set(updated);
        this.patientEditDialog = false;
        this.messages.add({
          severity: 'success',
          summary: 'Patient updated',
          detail: 'Details saved. MRN and registration record are unchanged.',
        });
        const ur = this.auth.user()?.role;
        if (
          ur === Role.DOCTOR ||
          ur === Role.RECEPTIONIST ||
          ur === Role.ADMIN
        ) {
          this.loadLabSection(updated);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.savingPatientEdit = false;
        const msg =
          typeof err.error?.message === 'string'
            ? err.error.message
            : Array.isArray(err.error?.message)
              ? err.error.message.join(', ')
              : err.message;
        this.messages.add({
          severity: 'error',
          summary: 'Could not save',
          detail: msg,
        });
      },
    });
  }

  private loadLabSection(p: Patient): void {
    this.labLoading.set(true);
    const ur = this.auth.user()?.role;
    const needTemplates =
      ur === Role.DOCTOR || ur === Role.LAB_TECH || ur === Role.ADMIN;

    if (needTemplates) {
      forkJoin({
        templates: this.labApi.listTemplates(),
        records: this.labApi.listRecords(100, p.mrn),
      }).subscribe({
        next: ({ templates, records }) => {
          this.labTemplates.set(templates);
          this.labRecords.set(records);
          this.labLoading.set(false);
        },
        error: () => {
          this.labTemplates.set([]);
          this.labRecords.set([]);
          this.labLoading.set(false);
        },
      });
    } else {
      this.labApi.listRecords(100, p.mrn).subscribe({
        next: (records) => {
          this.labTemplates.set([]);
          this.labRecords.set(records);
          this.labLoading.set(false);
        },
        error: () => {
          this.labRecords.set([]);
          this.labLoading.set(false);
        },
      });
    }
  }

  loadFees(patientId: string): void {
    this.feesApi.list(patientId).subscribe({
      next: (rows) => this.feeLines.set(rows),
      error: () => this.feeLines.set([]),
    });
  }

  feeTotal(): string {
    let s = 0;
    for (const l of this.feeLines()) {
      s += parseFloat(l.lineTotal);
    }
    return (Math.round(s * 100) / 100).toFixed(2);
  }

  catalogSelectOptions(): { label: string; value: string }[] {
    return this.catalogItems().map((c) => ({
      label: `${c.name} (${c.defaultPrice})`,
      value: c.id,
    }));
  }

  openAddFee(): void {
    const p = this.patient();
    if (!p) return;
    this.feeCatalogApi.listActive().subscribe({
      next: (items) => {
        this.catalogItems.set(items);
        this.addMode = 'catalog';
        this.selCatalogId = items[0]?.id ?? '';
        this.customDesc = '';
        this.qty = 1;
        this.syncUnitFromCatalog();
        this.addDialog = true;
      },
      error: () =>
        this.messages.add({
          severity: 'error',
          summary: 'Could not load fee list',
          detail: 'Ask admin to add services under Admin → Fee catalog.',
        }),
    });
  }

  onCatalogChange(): void {
    this.syncUnitFromCatalog();
  }

  private syncUnitFromCatalog(): void {
    const it = this.catalogItems().find((c) => c.id === this.selCatalogId);
    this.unitPrice = it ? parseFloat(it.defaultPrice) : 0;
  }

  saveNewFee(): void {
    const p = this.patient();
    if (!p) return;
    let body: CreatePatientFeeLineDto;
    if (this.addMode === 'custom') {
      const d = this.customDesc.trim();
      if (!d) {
        this.messages.add({
          severity: 'warn',
          summary: 'Enter a description',
        });
        return;
      }
      body = {
        customDescription: d,
        quantity: this.qty,
        unitPrice: this.unitPrice,
      };
    } else {
      if (!this.selCatalogId) {
        this.messages.add({
          severity: 'warn',
          summary: 'Select a service',
        });
        return;
      }
      body = {
        catalogItemId: this.selCatalogId,
        quantity: this.qty,
        unitPrice: this.unitPrice,
      };
    }
    this.feesApi.add(p.id, body).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: 'Charge added',
        });
        this.addDialog = false;
        this.loadFees(p.id);
      },
      error: () =>
        this.messages.add({
          severity: 'error',
          summary: 'Could not add charge',
        }),
    });
  }

  openEditFee(line: PatientFeeLine): void {
    this.editingLine.set(line);
    this.editQty = parseFloat(line.quantity);
    this.editUnitPrice = parseFloat(line.unitPrice);
    this.editDesc = line.description;
    this.editDialog = true;
  }

  saveEditFee(): void {
    const line = this.editingLine();
    const p = this.patient();
    if (!line || !p) return;
    const body: UpdatePatientFeeLineDto = {
      quantity: this.editQty,
      unitPrice: this.editUnitPrice,
    };
    if (!line.catalogItemId) {
      const d = this.editDesc.trim();
      if (!d) {
        this.messages.add({
          severity: 'warn',
          summary: 'Enter a description',
        });
        return;
      }
      body.description = d;
    }
    this.feesApi.update(p.id, line.id, body).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Charge updated' });
        this.editDialog = false;
        this.editingLine.set(null);
        this.loadFees(p.id);
      },
      error: () =>
        this.messages.add({
          severity: 'error',
          summary: 'Update failed',
          detail:
            'Catalog-linked lines keep the service name; only quantity and unit price can change.',
        }),
    });
  }

  removeFee(line: PatientFeeLine): void {
    const p = this.patient();
    if (!p) return;
    if (!confirm(`Remove line: ${line.description}?`)) return;
    this.feesApi.remove(p.id, line.id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Removed' });
        this.loadFees(p.id);
      },
      error: () =>
        this.messages.add({ severity: 'error', summary: 'Remove failed' }),
    });
  }

  print(): void {
    const p = this.patient();
    if (!p) return;
    void this.router.navigate(['/patients', p.id, 'print']);
  }

  printFees(): void {
    const p = this.patient();
    if (!p) return;
    void this.router.navigate(['/patients', p.id, 'fees-print']);
  }

  /** Compact thermal / POS-style charge slip (separate from A4 registration slip). */
  printFeesPos(): void {
    const p = this.patient();
    if (!p) return;
    void this.router.navigate(['/patients', p.id, 'fees-print-pos']);
  }

  printFeeLine(row: PatientFeeLine): void {
    const p = this.patient();
    if (!p) return;
    void this.router.navigate(['/patients', p.id, 'fees-print-pos', row.id]);
  }

  remove(): void {
    const p = this.patient();
    if (!p) return;
    if (!confirm(`Delete patient ${p.mrn}? This cannot be undone.`)) return;
    this.patientsApi.delete(p.id).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Patient removed.',
        });
        void this.router.navigate(['/patients']);
      },
      error: () =>
        this.messages.add({
          severity: 'error',
          summary: 'Delete failed',
          detail: 'You may not have permission.',
        }),
    });
  }
}
