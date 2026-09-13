import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  permissions?: Record<string, boolean>;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<{ access_token: string; user: CurrentUser }> {
    return this.http
      .post<{ access_token: string; user: CurrentUser }>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem('al_omran_token', res.access_token);
          localStorage.setItem('al_omran_user', JSON.stringify(res.user));
        }),
      );
  }

  logout() {
    localStorage.removeItem('al_omran_token');
    localStorage.removeItem('al_omran_user');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('al_omran_token');
  }

  getUser(): CurrentUser | null {
    const raw = localStorage.getItem('al_omran_user');
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isManagement(): boolean {
    const user = this.getUser();
    return user?.role === 'ADMIN' || user?.role === 'MANAGER';
  }

  // بيفحص إذا الموظف الحالي عنده صلاحية معينة مفعّلة - ADMIN و MANAGER عندهم كل شي دايمًا
  hasPermission(key: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'MANAGER') return true;
    return !!user.permissions?.[key];
  }

  // بيحدّث بيانات المستخدم المخزّنة محليًا من السيرفر - مفيد لما المدير يعدّل صلاحيات موظف وهو لسا فاتح النظام
  refreshMe(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => localStorage.setItem('al_omran_user', JSON.stringify(user))),
    );
  }

  // بينادى دوريًا (كل 30-60 ثانية) طول ما المستخدم فاتح صفحة بالنظام
  // هيك بيتحدث lastSeenAt بالسيرفر وبيصير الموظف يبين "أونلاين"
  heartbeat(): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/auth/heartbeat`, {});
  }
}
