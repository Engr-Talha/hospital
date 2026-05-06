import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CreateFeeCatalogItemDto,
  FeeCatalogItem,
  UpdateFeeCatalogItemDto,
} from '@hospital/shared';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { FeeCatalogService } from '../../core/fee-catalog.service';

@Component({
  selector: 'app-admin-fee-catalog',
  imports: [
    FormsModule,
    RouterLink,
    Card,
    TableModule,
    Button,
    Dialog,
    InputText,
    InputNumber,
    Tag,
    Toast,
    ToggleSwitch,
  ],
  templateUrl: './admin-fee-catalog.component.html',
  styleUrl: './admin-fee-catalog.component.scss',
})
export class AdminFeeCatalogComponent implements OnInit {
  private readonly api = inject(FeeCatalogService);
  private readonly messages = inject(MessageService);

  readonly rows = signal<FeeCatalogItem[]>([]);
  readonly loading = signal(false);
  dialogVisible = false;
  editingId: string | null = null;

  formName = '';
  formPrice = 0;
  formSort = 0;
  formActive = true;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.api.listAllAdmin().subscribe({
      next: (r) => {
        this.rows.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.formName = '';
    this.formPrice = 0;
    this.formSort = 0;
    this.formActive = true;
    this.dialogVisible = true;
  }

  openEdit(row: FeeCatalogItem): void {
    this.editingId = row.id;
    this.formName = row.name;
    this.formPrice = parseFloat(row.defaultPrice);
    this.formSort = row.sortOrder;
    this.formActive = row.isActive;
    this.dialogVisible = true;
  }

  save(): void {
    const name = this.formName.trim();
    if (!name) {
      this.messages.add({
        severity: 'warn',
        summary: 'Name required',
      });
      return;
    }
    if (this.editingId) {
      const body: UpdateFeeCatalogItemDto = {
        name,
        defaultPrice: this.formPrice,
        sortOrder: this.formSort,
        isActive: this.formActive,
      };
      this.api.update(this.editingId, body).subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: 'Updated',
          });
          this.dialogVisible = false;
          this.reload();
        },
        error: () =>
          this.messages.add({
            severity: 'error',
            summary: 'Save failed',
          }),
      });
    } else {
      const body: CreateFeeCatalogItemDto = {
        name,
        defaultPrice: this.formPrice,
        sortOrder: this.formSort,
      };
      this.api.create(body).subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: 'Created',
          });
          this.dialogVisible = false;
          this.reload();
        },
        error: () =>
          this.messages.add({
            severity: 'error',
            summary: 'Save failed',
          }),
      });
    }
  }

  deactivate(row: FeeCatalogItem): void {
    if (!confirm(`Deactivate "${row.name}"? It will disappear from billing lists.`))
      return;
    this.api.deactivate(row.id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Updated' });
        this.reload();
      },
      error: () =>
        this.messages.add({ severity: 'error', summary: 'Request failed' }),
    });
  }
}
