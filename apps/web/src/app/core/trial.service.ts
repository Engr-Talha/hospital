import { Injectable, computed, signal } from '@angular/core';

export type TrialPublicStatus = {
  trialEnabled: boolean;
  expired: boolean;
  endsAt: string | null;
  serverNow: string;
  msRemaining: number;
};

@Injectable({ providedIn: 'root' })
export class TrialService {
  readonly status = signal<TrialPublicStatus | null>(null);
  /** Ticks every second so countdown updates without polling the API. */
  readonly nowTick = signal(Date.now());
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private pollId: ReturnType<typeof setInterval> | null = null;

  readonly trialEnabled = computed(() => this.status()?.trialEnabled ?? false);
  readonly expired = computed(() => this.status()?.expired ?? false);

  readonly countdownText = computed(() => {
    const s = this.status();
    this.nowTick();
    if (!s?.trialEnabled || s.expired || !s.endsAt) return '';
    const end = new Date(s.endsAt).getTime();
    const ms = Math.max(0, end - Date.now());
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  });

  constructor() {
    setInterval(() => this.nowTick.set(Date.now()), 1000);
  }

  initPolling(): void {
    if (this.pollId) return;
    void this.refresh();
    this.pollId = setInterval(() => void this.refresh(), 120000);
  }

  stopPolling(): void {
    if (this.pollId) {
      clearInterval(this.pollId);
      this.pollId = null;
    }
  }

  /** Uses `fetch` so the auth interceptor is not involved (avoids circular DI). */
  async refresh(): Promise<void> {
    try {
      const res = await fetch('/api/trial/status', { credentials: 'include' });
      if (!res.ok) {
        this.status.set(null);
        return;
      }
      const s = (await res.json()) as TrialPublicStatus;
      this.status.set(s);
    } catch {
      this.status.set(null);
    }
  }

  markExpiredFromApi(): void {
    const cur = this.status();
    if (cur?.trialEnabled) {
      this.status.set({
        ...cur,
        expired: true,
        msRemaining: 0,
      });
    } else if (!cur) {
      this.status.set({
        trialEnabled: true,
        expired: true,
        endsAt: null,
        serverNow: new Date().toISOString(),
        msRemaining: 0,
      });
    }
  }
}
