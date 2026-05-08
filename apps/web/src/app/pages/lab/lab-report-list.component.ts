import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LabReportTemplateSummary, Role } from '@hospital/shared';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Tag } from 'primeng/tag';
import { LabReportsApiService } from '../../core/lab-reports-api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-lab-report-list',
  imports: [Card, Button, RouterLink, ProgressSpinner, Tag],
  templateUrl: './lab-report-list.component.html',
  styleUrl: './lab-report-list.component.scss',
})
export class LabReportListComponent implements OnInit {
  private readonly api = inject(LabReportsApiService);
  readonly auth = inject(AuthService);
  readonly Role = Role;

  readonly templates = signal<LabReportTemplateSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.listTemplates().subscribe({
      next: (t) => {
        this.templates.set(t);
        this.loading.set(false);
        this.error.set(null);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load report templates.');
      },
    });
  }
}
