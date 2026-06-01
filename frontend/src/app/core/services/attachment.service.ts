import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Attachment } from '../../shared/models/attachment.model';

@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private apiUrl = `${environment.apiUrl}/attachments`;

  constructor(private http: HttpClient) {}

  upload(file: File, category: string, accidentId?: string, repairId?: string, claimId?: string): Observable<Attachment> {
    const formData = new FormData();
    formData.append('file', file);

    let params = new HttpParams().set('category', category);
    if (accidentId) params = params.set('accidentId', accidentId);
    if (repairId) params = params.set('repairId', repairId);
    if (claimId) params = params.set('claimId', claimId);

    return this.http.post<Attachment>(`${this.apiUrl}/upload`, formData, { params });
  }

  findByAccident(accidentId: string): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(`${this.apiUrl}/accident/${accidentId}`);
  }

  findByRepair(repairId: string): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(`${this.apiUrl}/repair/${repairId}`);
  }

  findByClaim(claimId: string): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(`${this.apiUrl}/claim/${claimId}`);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getDownloadUrl(id: string): string {
    return `${this.apiUrl}/${id}/download`;
  }
}
