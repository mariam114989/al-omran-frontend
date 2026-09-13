import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ActivityLogService {
  private base = `${environment.apiUrl}/activity-log`;
  constructor(private http: HttpClient) {}

  findRecent(limit = 50): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}?limit=${limit}`);
  }
}
