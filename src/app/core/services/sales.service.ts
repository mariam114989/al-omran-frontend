import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Currency = string;

export interface CreateSalePayload {
  productId: string;
  quantity: number;
  price: number;
  currency: Currency;
}

export interface TodayTotals {
  syp: number;
  usd: number;
  count: number;
}

export interface DailyActivityRow {
  date: string;
  invoicesCount: number;
  salesCount: number;
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  private base = `${environment.apiUrl}/sales`;
  constructor(private http: HttpClient) {}

  findAll(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  create(payload: CreateSalePayload): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }

  todayTotals(): Observable<TodayTotals> {
    return this.http.get<TodayTotals>(`${this.base}/today-totals`);
  }

  dailyActivity(days = 7): Observable<DailyActivityRow[]> {
    return this.http.get<DailyActivityRow[]>(`${this.base}/daily-activity?days=${days}`);
  }
}
