import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { LabReportFieldSchema, LabReportTemplateSummary } from '@hospital/shared';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Textarea } from 'primeng/textarea';
import { LabReportsApiService } from '../../core/lab-reports-api.service';

function richTextRequired(
  control: AbstractControl,
): ValidationErrors | null {
  const v = control.value as string | null | undefined;
  if (v == null || typeof v !== 'string') return { required: true };
  const text = v
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return text.length === 0 ? { required: true } : null;
}

@Component({
  selector: 'app-lab-report-form',
  imports: [
    ReactiveFormsModule,
    CKEditorModule,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ckeditor5-build-classic vs @ckeditor/ckeditor5-angular Editor typings mismatch
  readonly Editor: any = ClassicEditor;

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
        const q = this.route.snapshot.queryParamMap;
        const pmrn = q.get('patientMrn');
        const pname = q.get('patientName');
        if (pmrn) this.form.patchValue({ patientMrn: pmrn });
        if (pname) this.form.patchValue({ patientName: pname });
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
    };
    for (const f of t.fieldsSchema) {
      const validators =
        f.type === 'richtext'
          ? [richTextRequired]
          : [Validators.required];
      controls[f.key] = this.fb.control('', {
        validators,
        nonNullable: true,
      });
    }
    this.form = this.fb.group(controls);
  }

  fields(): LabReportFieldSchema[] {
    return this.template()?.fieldsSchema ?? [];
  }

  submit(): void {
    const t = this.template();
    if (!t || !this.form) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue() as Record<string, string>;
    const patientMrn = raw['patientMrn'] ?? '';
    const patientName = raw['patientName'] ?? '';
    const fieldValues: Record<string, string> = {};
    for (const f of t.fieldsSchema) {
      fieldValues[f.key] = raw[f.key] ?? '';
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
