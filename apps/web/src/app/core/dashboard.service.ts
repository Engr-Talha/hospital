import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  DashboardOverview,
  LabBenchOverview,
  ReceptionDeskOverview,
} from '@hospital/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  overview(): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>('/api/dashboard/overview');
  }

  receptionDesk(): Observable<ReceptionDeskOverview> {
    return this.http.get<ReceptionDeskOverview>('/api/dashboard/reception-desk');
  }

  labBench(): Observable<LabBenchOverview> {
    return this.http.get<LabBenchOverview>('/api/dashboard/lab-bench');
  }
}
