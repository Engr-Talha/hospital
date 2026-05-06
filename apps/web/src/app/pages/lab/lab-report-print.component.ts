import { DatePipe } from '@angular/common';
import { Component, OnDestroy, inject, OnInit, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { LabReportFieldSchema, LabReportRecordDetail } from '@hospital/shared';
import { Button } from 'primeng/button';
import { APP_BRANDING } from '../../core/branding';
import { LabReportsApiService } from '../../core/lab-reports-api.service';

@Component({
  selector: 'app-lab-report-print',
  imports: [Button, DatePipe],
  templateUrl: './lab-report-print.component.html',
  styleUrl: './lab-report-print.component.scss',
})
export class LabReportPrintComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(LabReportsApiService);
  private readonly title = inject(Title);
  private previousTitle = '';

  readonly record = signal<LabReportRecordDetail | null>(null);
  readonly printedAt = signal(new Date());
  readonly branding = APP_BRANDING;

  ngOnInit(): void {
    this.previousTitle = this.title.getTitle();
    this.title.setTitle('');

    const id = this.route.snapshot.paramMap.get('recordId');
    if (!id) {
      void this.router.navigate(['/lab/reports']);
      return;
    }
    this.api.getRecord(id).subscribe({
      next: (r) => {
        this.record.set(r);
        this.printedAt.set(new Date());
        setTimeout(() => window.print(), 400);
      },
      error: () => void this.router.navigate(['/lab/reports']),
    });
  }

  ngOnDestroy(): void {
    if (this.previousTitle) this.title.setTitle(this.previousTitle);
  }

  triggerPrint(): void {
    window.print();
  }

  back(): void {
    void this.router.navigate(['/lab/reports/recent']);
  }

  orderedFields(schema: LabReportFieldSchema[]): LabReportFieldSchema[] {
    return [...schema];
  }

  fieldValue(key: string): string {
    const r = this.record();
    return r?.fieldValues[key] ?? '';
  }
}
