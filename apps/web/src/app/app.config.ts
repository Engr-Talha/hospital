import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Aura from '@primeng/themes/aura';
import { appRoutes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { AuthService } from './core/auth.service';
import { TrialService } from './core/trial.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(appRoutes),
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
    MessageService,
    provideAppInitializer(async () => {
      // Resolve inject() before any `await` — async continuation loses injection context (NG0203).
      const trial = inject(TrialService);
      const auth = inject(AuthService);
      await trial.refresh();
      trial.initPolling();
      await auth.initFromStorage();
    }),
  ],
};
