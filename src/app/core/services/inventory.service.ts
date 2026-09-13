import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StockReportRow {
  productId: string;
  name: string;
  category: string;
  sold: number;
  remaining: number;
}

export interface CurrentStockRow {
  productId: string;
  name: string;
  category: string;
  unit: string;
  remaining: number;
  minStockAlert: number;
  isLow: boolean;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private invoicesBase = `${environment.apiUrl}/invoices`;
  private reportsBase = `${environment.apiUrl}/reports`;
  constructor(private http: HttpClient) {}

  monthlyReport(year: number, month: number): Observable<StockReportRow[]> {
    return this.http.get<StockReportRow[]>(`${this.invoicesBase}/reports/monthly-stock?year=${year}&month=${month}`);
  }

  yearlyReport(year: number): Observable<StockReportRow[]> {
    return this.http.get<StockReportRow[]>(`${this.invoicesBase}/reports/yearly-stock?year=${year}`);
  }

  currentStock(): Observable<CurrentStockRow[]> {
    return this.http.get<CurrentStockRow[]>(`${this.invoicesBase}/reports/current-stock`);
  }

  // نفس فكرة تصدير الفواتير - لازم Blob مصادق عليه، مش رابط مباشر
  private download(url: string, filename: string) {
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(objUrl);
      },
      error: (err) => console.error('فشل تحميل ملف الجرد:', err),
    });
  }

  downloadMonthlyExcel(year: number, month: number) {
    this.download(`${this.reportsBase}/monthly-stock/excel?year=${year}&month=${month}`, `جرد-شهري-${year}-${month}.xlsx`);
  }

  downloadYearlyExcel(year: number) {
    this.download(`${this.reportsBase}/yearly-stock/excel?year=${year}`, `جرد-سنوي-${year}.xlsx`);
  }

  downloadCurrentExcel() {
    this.download(`${this.reportsBase}/current-stock/excel`, `الجرد-الحالي.xlsx`);
  }
}
