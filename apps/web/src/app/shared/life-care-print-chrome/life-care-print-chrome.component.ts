import { Component, input } from '@angular/core';
import { APP_BRANDING } from '../../core/branding';

/**
 * Shared letterhead for Life Care: lab reports, registration slip, fee slip (A4).
 * Matches clinic report template (blue/red header, double patient box, footer bar).
 */
@Component({
  selector: 'app-life-care-print-chrome',
  standalone: true,
  templateUrl: './life-care-print-chrome.component.html',
  styleUrl: './life-care-print-chrome.component.scss',
})
export class LifeCarePrintChromeComponent {
  readonly patientName = input.required<string>();
  readonly dateText = input<string | null | undefined>(undefined);
  readonly referredBy = input('');
  readonly patientId = input.required<string>();

  readonly branding = APP_BRANDING;

  referredByDisplay(): string {
    const v = this.referredBy().trim();
    return v.length > 0 ? v : '—';
  }
}
