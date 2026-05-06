import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CreatePatientFeeLineDto,
  PatientFeeLine,
  UpdatePatientFeeLineDto,
} from '@hospital/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PatientFeesService {
  constructor(private readonly http: HttpClient) {}

  list(patientId: string): Observable<PatientFeeLine[]> {
    return this.http.get<PatientFeeLine[]>(`/api/patients/${patientId}/fees`);
  }

  add(
    patientId: string,
    body: CreatePatientFeeLineDto,
  ): Observable<PatientFeeLine> {
    return this.http.post<PatientFeeLine>(
      `/api/patients/${patientId}/fees`,
      body,
    );
  }

  update(
    patientId: string,
    lineId: string,
    body: UpdatePatientFeeLineDto,
  ): Observable<PatientFeeLine> {
    return this.http.patch<PatientFeeLine>(
      `/api/patients/${patientId}/fees/${lineId}`,
      body,
    );
  }

  remove(patientId: string, lineId: string): Observable<void> {
    return this.http.delete<void>(
      `/api/patients/${patientId}/fees/${lineId}`,
    );
  }
}
