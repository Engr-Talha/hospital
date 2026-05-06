import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReceptionDeskOverview } from '@hospital/shared';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ProgressSpinner } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { DashboardService } from '../../core/dashboard.service';

@Component({
  selector: 'app-reception-desk',
  imports: [Card, Button, RouterLink, TableModule, ProgressSpinner, DatePipe],
  templateUrl: './reception-desk.component.html',
  styleUrl: './reception-desk.component.scss',
})
export class ReceptionDeskComponent implements OnInit {
  private readonly dashboardApi = inject(DashboardService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly desk = signal<ReceptionDeskOverview | null>(null);

  ngOnInit(): void {
    this.load();
  }

  retry(): void {
    this.loading.set(true);
    this.error.set(null);
    this.load();
  }

  private load(): void {
    this.dashboardApi.receptionDesk().subscribe({
      next: (d) => {
        this.desk.set(d);
        this.loading.set(false);
        this.error.set(null);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(
          'Could not load front desk summary. Check that you are signed in and the API is running.',
        );
      },
    });
  }
}
