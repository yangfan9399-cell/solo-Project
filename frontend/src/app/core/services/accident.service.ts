import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Accident, CreateAccidentRequest, UpdateAccidentStatusRequest, StatusLog, PaginatedResult } from '../../shared/models/accident.model';

@Injectable({ providedIn: 'root' })
export class AccidentService {
  private apiUrl = `${environment.apiUrl}/accidents`;

  constructor(private http: HttpClient) {}

  create(request: CreateAccidentRequest): Observable<Accident> {
    return this.http.post<Accident>(this.apiUrl, request);
  }

  findAll(page = 1, limit = 10, status?: string, mine?: boolean): Observable<PaginatedResult<Accident>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (status) {
      params = params.set('status', status);
    }
    if (mine) {
      params = params.set('mine', 'true');
    }

    return this.http.get<PaginatedResult<Accident>>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<Accident> {
    return this.http.get<Accident>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: string, request: UpdateAccidentStatusRequest): Observable<Accident> {
    return this.http.put<Accident>(`${this.apiUrl}/${id}/status`, request);
  }

  getStatusLogs(id: string): Observable<StatusLog[]> {
    return this.http.get<StatusLog[]>(`${this.apiUrl}/${id}/logs`);
  }

  scheduleOutOfService(id: string, request: {
    outOfServiceReason: string;
    expectedResumeTime?: string;
    remark?: string;
  }): Observable<Accident> {
    return this.http.post<Accident>(`${this.apiUrl}/${id}/schedule-out-of-service`, request);
  }

  confirmResume(id: string, request?: { remark?: string }): Observable<Accident> {
    return this.http.post<Accident>(`${this.apiUrl}/${id}/confirm-resume`, request || {});
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}
