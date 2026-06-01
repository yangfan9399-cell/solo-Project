import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Exception, CreateExceptionRequest, UpdateExceptionRequest } from '../../shared/models/exception.model';

@Injectable({ providedIn: 'root' })
export class ExceptionService {
  private apiUrl = `${environment.apiUrl}/exceptions`;

  constructor(private http: HttpClient) {}

  create(request: CreateExceptionRequest): Observable<Exception> {
    return this.http.post<Exception>(this.apiUrl, request);
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

  findOne(id: string): Observable<Exception> {
    return this.http.get<Exception>(`${this.apiUrl}/${id}`);
  }

  update(id: string, request: UpdateExceptionRequest): Observable<Exception> {
    return this.http.put<Exception>(`${this.apiUrl}/${id}`, request);
  }
}
