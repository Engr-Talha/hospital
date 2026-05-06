import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Patient, Permission } from '@hospital/shared';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { AuthService } from '../../core/auth.service';
import { PatientsService } from '../../core/patients.service';

@Component({
  selector: 'app-patient-list',
  imports: [TableModule, Button, InputText, RouterLink, Tag, FormsModule],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss',
})
export class PatientListComponent implements OnInit {
  private readonly patientsApi = inject(PatientsService);
  readonly auth = inject(AuthService);
  readonly Permission = Permission;

  readonly rows = signal<Patient[]>([]);
  readonly loading = signal(false);
  searchTerm = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.patientsApi
      .list({ page: 1, limit: 500, search: this.searchTerm })
      .subscribe({
        next: (res) => {
          this.rows.set(res.items);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
