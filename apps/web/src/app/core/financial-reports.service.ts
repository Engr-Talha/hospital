import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  AdminRevenueReportResponse,
  RevenueReportGroupBy,
} from '@hospital/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FinancialReportsService {
  constructor(private readonly http: HttpClient) {}

  revenueReport(
    from: string,
    to: string,
    groupBy: RevenueReportGroupBy,
  ): Observable<AdminRevenueReportResponse> {
    const params = new HttpParams()
      .set('from', from)
      .set('to', to)
      .set('groupBy', groupBy);
    return this.http.get<AdminRevenueReportResponse>(
      '/api/admin/revenue-report',
      { params },
    );
  }
}
