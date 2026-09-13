import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface CurrencySetting {
  id: string;
  code: string;
  name: string;
  isBase: boolean;
  rate: number;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private categoriesBase = `${environment.apiUrl}/categories`;
  private currenciesBase = `${environment.apiUrl}/currencies`;

  constructor(private http: HttpClient) {}

  // ==== الفئات ====
  findCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.categoriesBase);
  }

  createCategory(name: string): Observable<Category> {
    return this.http.post<Category>(this.categoriesBase, { name });
  }

  updateCategory(id: string, name: string): Observable<Category> {
    return this.http.patch<Category>(`${this.categoriesBase}/${id}`, { name });
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.categoriesBase}/${id}`);
  }

  // ==== العملات ====
  findCurrencies(): Observable<CurrencySetting[]> {
    return this.http.get<CurrencySetting[]>(this.currenciesBase);
  }

  createCurrency(code: string, name: string, rate: number): Observable<CurrencySetting> {
    return this.http.post<CurrencySetting>(this.currenciesBase, { code, name, rate });
  }

  updateCurrencyRate(code: string, rate: number, name?: string): Observable<CurrencySetting> {
    return this.http.patch<CurrencySetting>(`${this.currenciesBase}/${code}`, { rate, name });
  }

  deleteCurrency(code: string): Observable<any> {
    return this.http.delete(`${this.currenciesBase}/${code}`);
  }
}
