import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LabReportTemplateSummary } from '@hospital/shared';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Textarea } from 'primeng/textarea';
import { LabReportsApiService } from '../../core/lab-reports-api.service';

@Component({
  selector: 'app-lab-report-form',
  imports: [
    ReactiveFormsModule,
    Card,
    Button,
    InputText,
    Textarea,
    RouterLink,
    ProgressSpinner,
    Toast,
  ],
  templateUrl: './lab-report-form.component.html',
  styleUrl: './lab-report-form.component.scss',
})
export class LabReportFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(LabReportsApiService);
  private readonly messages = inject(MessageService);

  readonly template = signal<LabReportTemplateSummary | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  form!: FormGroup;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('templateId');
    if (!id) {
      void this.router.navigate(['/lab/reports']);
      return;
    }
    this.api.getTemplate(id).subscribe({
      next: (t) => {
        this.template.set(t);
        this.buildForm(t);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        void this.router.navigate(['/lab/reports']);
      },
    });
  }

  private buildForm(t: LabReportTemplateSummary): void {
    const controls: Record<string, FormControl<string | null>> = {
      patientMrn: this.fb.control('', {
        validators: [Validators.required, Validators.maxLength(64)],
        nonNullable: true,
      }),
      patientName: this.fb.control('', {
        validators: [Validators.required, Validators.maxLength(200)],
        nonNullable: true,
      }),
      reportText: this.fb.control('', {
        validators: [Validators.required, Validators.maxLength(20000)],
        nonNullable: true,
      }),
    }
    this.form = this.fb.group(controls);
  }

  submit(): void {
    const t = this.template();
    if (!t || !this.form) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue() as Record<string, string>;
    const patientMrn = raw['patientMrn'] ?? '';
    const patientName = raw['patientName'] ?? '';
    const reportText = raw['reportText'] ?? '';
    const fieldValues: Record<string, string> = {};
    for (const [index, f] of t.fieldsSchema.entries()) {
      fieldValues[f.key] = index === 0 ? reportText : '';
    }

    this.saving.set(true);
    this.api
      .createRecord({
        templateId: t.id,
        patientMrn,
        patientName,
        fieldValues,
      })
      .subscribe({
        next: (rec) => {
          this.saving.set(false);
          this.messages.add({
            severity: 'success',
            summary: 'Report saved',
          });
          void this.router.navigate(['/lab/reports/print', rec.id]);
        },
        error: () => {
          this.saving.set(false);
          this.messages.add({
            severity: 'error',
            summary: 'Save failed',
            detail: 'Check all fields and try again.',
          });
        },
      });
  }
}
