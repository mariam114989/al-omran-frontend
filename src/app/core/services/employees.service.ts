import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  createdAt: string;
}

export interface OnlineEmployee {
  id: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  lastSeenAt: string;
}

export interface EmployeeSalesSummary {
  employeeId: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  invoicesCount: number;
  invoicesPieces: number;
  salesCount: number;
  salesPieces: number;
  sypTotal: number;
  usdTotal: number;
}

export interface PermissionCatalogItem {
  key: string;
  label: string;
}

export interface EmployeePermissions {
  employeeId: string;
  name: string;
  permissions: Record<string, boolean>;
}

@Injectable({ providedIn: 'root' })
export class EmployeesService {
  private base = `${environment.apiUrl}/employees`;
  constructor(private http: HttpClient) {}

  findAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.base);
  }

  findOnline(): Observable<OnlineEmployee[]> {
    return this.http.get<OnlineEmployee[]>(`${this.base}/online`);
  }

  salesSummary(): Observable<EmployeeSalesSummary[]> {
    return this.http.get<EmployeeSalesSummary[]>(`${this.base}/sales-summary`);
  }

  create(payload: { name: string; email: string; phone?: string; password: string; role: string }): Observable<Employee> {
    return this.http.post<Employee>(this.base, payload);
  }

  performance(id: string, from?: string, to?: string): Observable<any> {
    let url = `${this.base}/${id}/performance`;
    const params: string[] = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    if (params.length) url += `?${params.join('&')}`;
    return this.http.get<any>(url);
  }

  // المكان الخاص بالمدير: قائمة كل الصلاحيات المتاحة بالنظام
  permissionsCatalog(): Observable<PermissionCatalogItem[]> {
    return this.http.get<PermissionCatalogItem[]>(`${this.base}/permissions/catalog`);
  }

  getPermissions(id: string): Observable<EmployeePermissions> {
    return this.http.get<EmployeePermissions>(`${this.base}/${id}/permissions`);
  }

  setPermissions(id: string, permissions: Record<string, boolean>): Observable<EmployeePermissions> {
    return this.http.patch<EmployeePermissions>(`${this.base}/${id}/permissions`, { permissions });
  }
}
