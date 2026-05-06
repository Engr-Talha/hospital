import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LabReportRecordSummary } from '@hospital/shared';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ProgressSpinner } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { LabReportsApiService } from '../../core/lab-reports-api.service';

@Component({
  selector: 'app-lab-report-recent',
  imports: [Card, TableModule, Button, RouterLink, DatePipe, ProgressSpinner],
  templateUrl: './lab-report-recent.component.html',
  styleUrl: './lab-report-recent.component.scss',
})
export class LabReportRecentComponent implements OnInit {
  private readonly api = inject(LabReportsApiService);

  readonly rows = signal<LabReportRecordSummary[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.api.listRecords(100).subscribe({
      next: (r) => {
        this.rows.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
