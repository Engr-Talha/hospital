import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateDoctorRequest, DoctorSummary } from '@hospital/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminDoctorsService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<DoctorSummary[]> {
    return this.http.get<DoctorSummary[]>('/api/admin/doctors');
  }

  create(body: CreateDoctorRequest): Observable<DoctorSummary> {
    return this.http.post<DoctorSummary>('/api/admin/doctors', body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/doctors/${id}`);
  }
}
