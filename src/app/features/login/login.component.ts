import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrap">
      <div class="login-card">
        <img src="assets/logo.png" alt="شعار العمران" class="logo-img" />
        <h1>العمران</h1>
        <p class="sub">تسجيل الدخول لنظام الفواتير والمخزون</p>

        <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>

        <div class="field">
          <label>البريد الإلكتروني</label>
          <input type="email" [(ngModel)]="email" placeholder="name@al-omran.com" />
        </div>
        <div class="field">
          <label>كلمة المرور</label>
          <input type="password" [(ngModel)]="password" placeholder="••••••••" (keyup.enter)="submit()" />
        </div>

        <button class="btn-copper full" (click)="submit()" [disabled]="loading">
          {{ loading ? '...جاري الدخول' : 'دخول' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;}
    .login-card{background:var(--bg-surface);border:1px solid rgba(14,138,160,0.35);border-radius:16px;padding:36px 32px;width:340px;text-align:center;}
    .logo-img{width:70px;height:73px;border-radius:12px;background:#fff;padding:4px;object-fit:contain;margin-bottom:14px;}
    h1{font-size:24px;margin-bottom:6px;}
    .sub{font-size:12.5px;color:var(--text-dim);margin-bottom:22px;}
    .field{text-align:right;}
    .btn-copper.full{width:100%;margin-top:8px;}
    .btn-copper:disabled{opacity:0.6;}
  `],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMsg = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (!this.email || !this.password) {
      this.errorMsg = 'الرجاء تعبئة البريد وكلمة المرور';
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'بيانات الدخول غير صحيحة';
      },
    });
  }
}
