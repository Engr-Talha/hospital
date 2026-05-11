import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminRevenueReportResponse,
  RevenueReportGroupBy,
} from '@hospital/shared';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { FinancialReportsService } from '../../core/financial-reports.service';

@Component({
  selector: 'app-admin-revenue-report',
  imports: [
    DecimalPipe,
    FormsModule,
    Card,
    Button,
    Select,
    TableModule,
    ProgressSpinner,
    Toast,
  ],
  templateUrl: './admin-revenue-report.component.html',
  styleUrl: './admin-revenue-report.component.scss',
})
export class AdminRevenueReportComponent implements OnInit {
  private readonly api = inject(FinancialReportsService);
  private readonly messages = inject(MessageService);

  readonly report = signal<AdminRevenueReportResponse | null>(null);
  readonly loading = signal(false);

  fromDate = '';
  toDate = '';
  groupBy: RevenueReportGroupBy = 'day';

  readonly groupOptions: { label: string; value: RevenueReportGroupBy }[] = [
    { label: 'By day', value: 'day' },
    { label: 'By week (Mon start)', value: 'week' },
    { label: 'By month', value: 'month' },
  ];

  ngOnInit(): void {
    this.applyPresetMonth();
    this.load();
  }

  private toYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  applyPresetMonth(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    this.fromDate = this.toYmd(start);
    this.toDate = this.toYmd(now);
  }

  applyPresetWeek(): void {
    const now = new Date();
    const day = now.getDay();
    const diff = (day + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    this.fromDate = this.toYmd(monday);
    this.toDate = this.toYmd(now);
  }

  applyPresetLastDays(n: number): void {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - (n - 1));
    this.fromDate = this.toYmd(start);
    this.toDate = this.toYmd(now);
  }

  load(): void {
    if (!this.fromDate || !this.toDate) {
      this.messages.add({
        severity: 'warn',
        summary: 'Choose a date range',
      });
      return;
    }
    this.loading.set(true);
    this.api.revenueReport(this.fromDate, this.toDate, this.groupBy).subscribe({
      next: (r) => {
        this.report.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Could not load report',
        });
      },
    });
  }
}
