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
  /** Reporting / checking doctor shown in patient box (e.g. radiologist). */
  readonly checkedBy = input('');
  /** Lab reports omit radiologist block; fee slips keep it. */
  readonly showDoctorInFooter = input(true);
  /** Lab / clinic PDFs omit the HIS vendor line under the letterhead. */
  readonly showVendorFooter = input(true);

  readonly branding = APP_BRANDING;

  referredByDisplay(): string {
    const v = this.referredBy().trim();
    return v.length > 0 ? v : '—';
  }

  checkedByDisplay(): string {
    const v = this.checkedBy().trim();
    return v.length > 0 ? v : '—';
  }
}
