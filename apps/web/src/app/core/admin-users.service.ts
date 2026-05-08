import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CreateStaffUserRequest,
  StaffUserSummary,
} from '@hospital/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<StaffUserSummary[]> {
    return this.http.get<StaffUserSummary[]>('/api/admin/users');
  }

  create(body: CreateStaffUserRequest): Observable<StaffUserSummary> {
    return this.http.post<StaffUserSummary>('/api/admin/users', body);
  }
}
