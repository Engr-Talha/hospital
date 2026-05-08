import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DashboardOverview,
  ReceptionistPerformanceOverview,
  Role,
} from '@hospital/shared';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ProgressSpinner } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { UIChart } from 'primeng/chart';
import { AuthService } from '../../core/auth.service';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../core/dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    Card,
    Button,
    RouterLink,
    UIChart,
    TableModule,
    ProgressSpinner,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly dashboardApi = inject(DashboardService);

  readonly adminRole = Role.ADMIN;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly overview = signal<DashboardOverview | null>(null);
  readonly receptionPerf = signal<ReceptionistPerformanceOverview | null>(null);

  regChartData: unknown;
  regChartOptions: Record<string, unknown>;
  revChartData: unknown;
  revChartOptions: Record<string, unknown>;
  genderChartData: unknown;
  genderChartOptions: Record<string, unknown>;
  categoryChartData: unknown;
  categoryChartOptions: Record<string, unknown>;
  topServicesChartData: unknown;
  topServicesChartOptions: Record<string, unknown>;

  constructor() {
    const axisOpts = {
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: { maxRotation: 45, minRotation: 0 },
    };
    this.regChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: { x: axisOpts, y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    };
    this.revChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: (ctx: { parsed?: { y?: number }; dataset?: { label?: string } }) => {
              const v = ctx.parsed?.y ?? 0;
              return `${ctx.dataset?.label ?? ''}: ${v.toFixed(2)}`;
            },
          },
        },
      },
      scales: { x: axisOpts, y: { beginAtZero: true } },
    };
    this.genderChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    };
    this.categoryChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y' as const,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } },
    };
    this.topServicesChartOptions = {
      ...this.categoryChartOptions,
      scales: { x: { beginAtZero: true } },
    };
  }

  ngOnInit(): void {
    this.loadOverview();
  }

  private loadOverview(): void {
    forkJoin({
      overview: this.dashboardApi.overview(),
      receptionists: this.dashboardApi.receptionistPerformance(),
    }).subscribe({
      next: ({ overview, receptionists }) => {
        this.overview.set(overview);
        this.receptionPerf.set(receptionists);
        this.buildCharts(overview);
        this.loading.set(false);
        this.error.set(null);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(
          'Could not load dashboard. Check that you are signed in and the API is running.',
        );
      },
    });
  }

  private buildCharts(o: DashboardOverview): void {
    const regLabels = o.patients.dailyRegistrations.map((d) => d.date.slice(5));
    this.regChartData = {
      labels: regLabels,
      datasets: [
        {
          label: 'New registrations',
          data: o.patients.dailyRegistrations.map((d) => d.count ?? 0),
          fill: true,
          tension: 0.25,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
        },
      ],
    };

    const revLabels = o.fees.dailyRevenue.map((d) => d.date.slice(5));
    this.revChartData = {
      labels: revLabels,
      datasets: [
        {
          label: 'Daily revenue',
          data: o.fees.dailyRevenue.map((d) => parseFloat(d.total ?? '0')),
          fill: true,
          tension: 0.25,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
        },
      ],
    };

    const g = o.patients.byGender;
    const palette = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#64748b'];
    this.genderChartData = {
      labels: g.map((x) => x.gender),
      datasets: [
        {
          data: g.map((x) => x.count),
          backgroundColor: g.map((_, i) => palette[i % palette.length]),
        },
      ],
    };

    const cat = o.fees.byCategory.slice(0, 12);
    this.categoryChartData = {
      labels: cat.map((c) => c.category || 'Uncategorized'),
      datasets: [
        {
          label: 'Revenue',
          data: cat.map((c) => parseFloat(c.total)),
          backgroundColor: 'rgba(99, 102, 241, 0.75)',
        },
      ],
    };

    const top = o.fees.topServices.slice(0, 10);
    this.topServicesChartData = {
      labels: top.map((s) => (s.name.length > 28 ? s.name.slice(0, 26) + '…' : s.name)),
      datasets: [
        {
          label: 'Revenue',
          data: top.map((s) => parseFloat(s.total)),
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
        },
      ],
    };
  }

  retry(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadOverview();
  }
}
