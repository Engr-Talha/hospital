import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LabBenchOverview } from '@hospital/shared';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ProgressSpinner } from 'primeng/progressspinner';
import { DashboardService } from '../../core/dashboard.service';

@Component({
  selector: 'app-lab-home',
  imports: [Card, Button, RouterLink, ProgressSpinner, DatePipe],
  templateUrl: './lab-home.component.html',
  styleUrl: './lab-home.component.scss',
})
export class LabHomeComponent implements OnInit {
  private readonly dashboardApi = inject(DashboardService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly bench = signal<LabBenchOverview | null>(null);

  ngOnInit(): void {
    this.load();
  }

  retry(): void {
    this.loading.set(true);
    this.error.set(null);
    this.load();
  }

  private load(): void {
    this.dashboardApi.labBench().subscribe({
      next: (b) => {
        this.bench.set(b);
        this.loading.set(false);
        this.error.set(null);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load lab workspace.');
      },
    });
  }
}
