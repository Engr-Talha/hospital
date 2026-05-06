import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrialPublicStatus, TrialService } from '../../core/trial.service';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-trial-recovery',
  imports: [
    FormsModule,
    Card,
    InputText,
    Password,
    InputNumber,
    Button,
    Toast,
  ],
  templateUrl: './trial-recovery.component.html',
  styleUrl: './trial-recovery.component.scss',
})
export class TrialRecoveryComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly trialMain = inject(TrialService);
  private readonly messages = inject(MessageService);

  readonly status = signal<TrialPublicStatus | null>(null);
  recoveryToken = '';
  extendDays = 7;
  trialEndsAt = '';

  ngOnInit(): void {
    void this.reloadStatus();
  }

  async reloadStatus(): Promise<void> {
    await this.trialMain.refresh();
    this.status.set(this.trialMain.status());
  }

  apply(): void {
    const token = this.recoveryToken.trim();
    if (!token) {
      this.messages.add({
        severity: 'warn',
        summary: 'Enter recovery token',
      });
      return;
    }
    const body: { extendDays?: number; trialEndsAt?: string } = {};
    if (this.trialEndsAt.trim()) {
      body.trialEndsAt = new Date(this.trialEndsAt).toISOString();
    } else if (this.extendDays > 0) {
      body.extendDays = this.extendDays;
    } else {
      this.messages.add({
        severity: 'warn',
        summary: 'Set an end date or extension days',
      });
      return;
    }

    this.http
      .patch<TrialPublicStatus>('/api/trial/manage', body, {
        headers: new HttpHeaders({
          'X-MGL-Trial-Recovery': token,
        }),
      })
      .subscribe({
        next: async (s) => {
          this.messages.add({
            severity: 'success',
            summary: 'Trial updated',
          });
          this.status.set(s);
          await this.trialMain.refresh();
        },
        error: (err: { status?: number }) => {
          this.messages.add({
            severity: 'error',
            summary:
              err?.status === 401 ? 'Invalid token' : 'Update failed',
          });
        },
      });
  }
}
