import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<AdminUserRow[]> {
    return this.http.get<AdminUserRow[]>('/api/admin/users');
  }
}
