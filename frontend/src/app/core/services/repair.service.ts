import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Repair, CreateRepairRequest, UpdateRepairRequest } from '../../shared/models/repair.model';

@Injectable({ providedIn: 'root' })
export class RepairService {
  private apiUrl = `${environment.apiUrl}/repairs`;

  constructor(private http: HttpClient) {}

  create(request: CreateRepairRequest): Observable<Repair> {
    return this.http.post<Repair>(this.apiUrl, request);
  }

  findAll(page = 1, limit = 10, status?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  findByAccident(accidentId: string): Observable<Repair[]> {
    return this.http.get<Repair[]>(`${this.apiUrl}/accident/${accidentId}`);
  }

  findOne(id: string): Observable<Repair> {
    return this.http.get<Repair>(`${this.apiUrl}/${id}`);
  }

  update(id: string, request: UpdateRepairRequest): Observable<Repair> {
    return this.http.put<Repair>(`${this.apiUrl}/${id}`, request);
  }
}
