import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Claim, CreateClaimRequest, UpdateClaimRequest } from '../../shared/models/claim.model';

@Injectable({ providedIn: 'root' })
export class ClaimService {
  private apiUrl = `${environment.apiUrl}/claims`;

  constructor(private http: HttpClient) {}

  create(request: CreateClaimRequest): Observable<Claim> {
    return this.http.post<Claim>(this.apiUrl, request);
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

  findByAccident(accidentId: string): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${this.apiUrl}/accident/${accidentId}`);
  }

  findOne(id: string): Observable<Claim> {
    return this.http.get<Claim>(`${this.apiUrl}/${id}`);
  }

  update(id: string, request: UpdateClaimRequest): Observable<Claim> {
    return this.http.put<Claim>(`${this.apiUrl}/${id}`, request);
  }
}
