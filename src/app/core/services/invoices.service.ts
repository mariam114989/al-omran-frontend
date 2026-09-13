import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InvoiceItemInput {
  productId: string;
  quantity: number;
}

export interface CreateInvoicePayload {
  type: 'REGULAR' | 'MERCHANT';
  merchantName?: string;
  merchantPhone?: string;
  logoUrl?: string;
  items: InvoiceItemInput[];
}

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private base = `${environment.apiUrl}/invoices`;
  private reportsBase = `${environment.apiUrl}/reports`;
  constructor(private http: HttpClient) {}

  findAll(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  findOne(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  create(payload: CreateInvoicePayload): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }

  // التصدير لازم يمر عبر HttpClient (مش رابط مباشر <a href>) حتى يرفق الـ interceptor
  // توكن الدخول تلقائيًا بالطلب - رابط مباشر بيتخطى الـ interceptor وبيرجع 401
  downloadExcel(invoiceId: string, invoiceNumber: string) {
    this.http.get(`${this.reportsBase}/invoice/${invoiceId}/excel`, { responseType: 'blob' }).subscribe({
      next: (blob) => this.triggerDownload(blob, `invoice-${invoiceNumber}.xlsx`),
      error: (err) => console.error('فشل تحميل Excel:', err),
    });
  }

  downloadPdf(invoiceId: string, invoiceNumber: string) {
    this.http.get(`${this.reportsBase}/invoice/${invoiceId}/pdf`, { responseType: 'blob' }).subscribe({
      next: (blob) => this.triggerDownload(blob, `invoice-${invoiceNumber}.pdf`),
      error: (err) => console.error('فشل تحميل PDF:', err),
    });
  }

  private triggerDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
