import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  totalPrice: number;
  unitPrice: number;
  discountPercent: number;
  stockQuantity: number;
  minStockAlert: number;
}

export interface ExtractedRow {
  rawLine: string;
  guessedName: string;
  numbers: number[];
}

export interface ImportProductRow {
  name: string;
  category: string;
  unit: string;
  totalPrice: number;
  unitPrice: number;
  discountPercent: number;
  stockQuantity: number;
  minStockAlert: number;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private base = `${environment.apiUrl}/products`;
  constructor(private http: HttpClient) {}

  findAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.base);
  }

  findCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/categories`);
  }

  findLowStock(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}?lowStock=true`);
  }

  create(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.base, product);
  }

  update(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.patch<Product>(`${this.base}/${id}`, product);
  }

  // تعديل الكمية الموجودة فقط (دلتا موجبة = زيادة، سالبة = إنقاص) - لتصحيح الجرد
  adjustStock(id: string, delta: number): Observable<Product> {
    return this.http.patch<Product>(`${this.base}/${id}/adjust-stock`, { delta });
  }

  // خطوة 1: يرفع الـ PDF ويرجع صفوف مستخرجة للمراجعة - ما بيحفظ أي شي لسا
  previewPdfImport(file: File): Observable<ExtractedRow[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ExtractedRow[]>(`${this.base}/import-pdf/preview`, formData);
  }

  // نفس فكرة استيراد الـ PDF بس من ملف إكسل (xlsx/xls)
  previewExcelImport(file: File): Observable<ExtractedRow[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ExtractedRow[]>(`${this.base}/import-excel/preview`, formData);
  }

  // خطوة 2: بعد ما المستخدم يراجع ويعدّل الصفوف، يبعتها هون للحفظ الفعلي
  // منتج موجود أصلاً بيتزوّد مخزونه، منتج جديد بينعمل كصنف جديد
  confirmPdfImport(rows: ImportProductRow[]): Observable<{ restockedCount: number; createdCount: number }> {
    return this.http.post<{ restockedCount: number; createdCount: number }>(`${this.base}/import-pdf/confirm`, { rows });
  }
}
