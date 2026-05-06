import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { TrialService } from '../../core/trial.service';
import { APP_BRANDING } from '../../core/branding';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    Card,
    InputText,
    Password,
    Button,
    Toast,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly trial = inject(TrialService);
  private readonly messages = inject(MessageService);

  readonly branding = APP_BRANDING;
  trialEndedBanner = false;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = false;

  constructor() {
    if (this.auth.token() && !(this.trial.trialEnabled() && this.trial.expired())) {
      void this.router.navigateByUrl(this.auth.homePath());
    }
  }

  ngOnInit(): void {
    this.trialEndedBanner =
      this.route.snapshot.queryParamMap.get('trialEnded') === '1';
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading = true;
    try {
      await this.auth.login(this.form.getRawValue());
    } catch (e: unknown) {
      let detail = 'Check email and password.';
      if (
        e instanceof HttpErrorResponse &&
        e.status === 403 &&
        e.error?.message === 'TRIAL_EXPIRED'
      ) {
        detail =
          'Trial period has ended. Please contact Malgray Labs for activation.';
        this.trial.markExpiredFromApi();
      }
      this.messages.add({
        severity: 'error',
        summary: 'Login failed',
        detail,
      });
    } finally {
      this.loading = false;
    }
  }
}
