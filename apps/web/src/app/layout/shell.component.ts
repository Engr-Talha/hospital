import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Permission, Role } from '@hospital/shared';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { Toast } from 'primeng/toast';
import { AuthService } from '../core/auth.service';
import { APP_BRANDING } from '../core/branding';

@Component({
  selector: 'app-shell',
  imports: [RouterModule, Menubar, Toast],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  readonly auth = inject(AuthService);

  readonly branding = APP_BRANDING;

  readonly menuModel = computed((): MenuItem[] => {
    const u = this.auth.user();
    const items: MenuItem[] = [
      {
        label:
          u?.role === Role.ADMIN
            ? 'Admin overview'
            : u?.role === Role.RECEPTIONIST
              ? 'Front desk'
              : 'Lab',
        icon: 'pi pi-home',
        routerLink: [this.auth.homePath()],
      },
      {
        label: 'Patients',
        icon: 'pi pi-users',
        routerLink: ['/patients'],
      },
    ];
    if (this.auth.hasPermission(Permission.PATIENT_REGISTER)) {
      items.push({
        label: 'Register patient',
        icon: 'pi pi-user-plus',
        routerLink: ['/patients/new'],
      });
    }
    if (u?.role === Role.ADMIN) {
      items.push({
        label: 'Admin',
        icon: 'pi pi-shield',
        items: [
          {
            label: 'Users',
            icon: 'pi pi-users',
            routerLink: ['/admin/users'],
          },
          {
            label: 'Fee catalog',
            icon: 'pi pi-list',
            routerLink: ['/admin/fee-catalog'],
          },
        ],
      });
    }
    items.push({
      label: u?.name ?? 'Account',
      icon: 'pi pi-user',
      items: [
        {
          label: 'Logout',
          icon: 'pi pi-sign-out',
          command: () => this.auth.logout(),
        },
      ],
    });
    return items;
  });
}
