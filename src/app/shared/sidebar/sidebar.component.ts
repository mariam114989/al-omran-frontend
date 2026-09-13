import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ProductsService, Product } from '../../core/services/products.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="brand-row">
        <div class="brand">
          <img src="assets/logo.png" alt="شعار العمران" class="logo-img" />
          <div><h1>العمران</h1><span>AL-OMRAN SYSTEM</span></div>
        </div>

        <!-- جرس التنبيهات - يفحص المنتجات تحت حد التنبيه الخاص فيها كل 30 ثانية -->
        <div class="bell-wrap">
          <button class="bell-btn" (click)="showDropdown = !showDropdown" title="تنبيهات المخزون">
            🔔
            <span class="badge" *ngIf="lowStockItems.length">{{ lowStockItems.length }}</span>
          </button>
          <div class="dropdown" *ngIf="showDropdown">
            <div class="dropdown-header">تنبيهات نواقص المخزون</div>
            <div class="dropdown-empty" *ngIf="!lowStockItems.length">لا يوجد نواقص حاليًا ✓</div>
            <div class="dropdown-item" *ngFor="let p of lowStockItems" (click)="goToProducts()">
              <span class="dot"></span>
              <div>
                <div class="p-name">{{ p.name }}</div>
                <div class="p-meta">متبقي {{ p.stockQuantity }} — الحد {{ p.minStockAlert }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav>
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">الرئيسية</a>
        <a routerLink="/products" routerLinkActive="active" class="nav-item">المنتجات</a>
        <a *ngIf="auth.isManagement()" routerLink="/inventory" routerLinkActive="active" class="nav-item">الجرد</a>
        <a routerLink="/invoices" routerLinkActive="active" class="nav-item">الفواتير</a>
        <a routerLink="/sales" routerLinkActive="active" class="nav-item">المبيعات</a>
        <a *ngIf="auth.isManagement()" routerLink="/employees" routerLinkActive="active" class="nav-item">الموظفون</a>
        <a *ngIf="auth.isManagement()" routerLink="/settings" routerLinkActive="active" class="nav-item">الإعدادات</a>
        <a *ngIf="auth.isManagement()" routerLink="/activity-log" routerLinkActive="active" class="nav-item">سجل النشاط</a>
      </nav>
      <div class="user-chip" *ngIf="auth.getUser() as user">
        <div class="avatar">{{ user.name.charAt(0) }}</div>
        <div>
          <div class="uname">{{ user.name }}</div>
          <div class="role">{{ user.role }}</div>
        </div>
        <button class="logout-btn" (click)="auth.logout()" title="تسجيل خروج">⏻</button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar{width:250px;background:var(--bg-surface);border-left:1px solid rgba(14,138,160,0.35);display:flex;flex-direction:column;padding:24px 18px;flex-shrink:0;min-height:100vh;}
    .brand-row{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:36px;}
    .brand{display:flex;align-items:center;gap:10px;}
    .logo-img{width:36px;height:37px;border-radius:8px;background:#fff;padding:2px;object-fit:contain;}
    .brand h1{font-size:22px;}
    .brand span{display:block;font-size:9.5px;color:var(--copper-light);font-family:'IBM Plex Mono',monospace;letter-spacing:1.5px;}

    .bell-wrap{position:relative;}
    .bell-btn{background:var(--bg-surface-2);border:1px solid rgba(14,138,160,0.4);border-radius:8px;width:34px;height:34px;font-size:15px;position:relative;color:var(--text-light);}
    .badge{position:absolute;top:-6px;left:-6px;background:var(--danger);color:#fff;font-size:10px;font-weight:700;border-radius:10px;min-width:16px;height:16px;display:flex;align-items:center;justify-content:center;padding:0 3px;}
    .dropdown{position:absolute;top:42px;left:0;width:260px;background:var(--bg-deep);border:1px solid rgba(14,138,160,0.4);border-radius:10px;padding:10px;z-index:50;box-shadow:0 8px 24px rgba(0,0,0,0.4);max-height:320px;overflow-y:auto;}
    .dropdown-header{font-size:12px;font-weight:700;color:var(--copper-light);margin-bottom:8px;padding:0 4px;}
    .dropdown-empty{font-size:12px;color:var(--text-dim);padding:10px 4px;}
    .dropdown-item{display:flex;align-items:center;gap:8px;padding:8px 6px;border-radius:6px;cursor:pointer;}
    .dropdown-item:hover{background:rgba(14,138,160,0.12);}
    .dot{width:7px;height:7px;border-radius:50%;background:var(--danger);flex-shrink:0;}
    .p-name{font-size:12.5px;color:var(--text-light);}
    .p-meta{font-size:10.5px;color:var(--text-dim);margin-top:2px;}

    nav{display:flex;flex-direction:column;gap:4px;flex:1;}
    .nav-item{display:block;padding:11px 14px;border-radius:8px;color:var(--text-dim);font-size:14.5px;text-decoration:none;transition:.15s;}
    .nav-item:hover{background:rgba(14,138,160,0.15);color:var(--text-light);}
    .nav-item.active{background:var(--copper);color:#1a1108;font-weight:600;}
    .user-chip{display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg-surface-2);border-radius:10px;}
    .avatar{width:34px;height:34px;border-radius:50%;background:var(--copper);display:flex;align-items:center;justify-content:center;font-weight:700;color:#1a1108;font-size:14px;flex-shrink:0;}
    .uname{font-size:13px;font-weight:600;}
    .role{font-size:11px;color:var(--text-dim);}
    .logout-btn{background:none;border:none;color:var(--text-dim);font-size:16px;margin-right:auto;}
  `],
})
export class SidebarComponent implements OnInit, OnDestroy {
  lowStockItems: Product[] = [];
  showDropdown = false;
  private pollSub?: Subscription;
  private heartbeatSub?: Subscription;

  constructor(public auth: AuthService, private productsSvc: ProductsService, private router: Router) {}

  ngOnInit() {
    // أول فحص فورًا، وبعدها كل 30 ثانية تلقائيًا - كل منتج بيتفحص مقابل "حد التنبيه" الخاص فيه
    this.pollSub = interval(30000)
      .pipe(startWith(0), switchMap(() => this.productsSvc.findLowStock()))
      .subscribe({
        next: (data) => (this.lowStockItems = data),
        error: () => {}, // ما منوقف البولينغ حتى لو صار خطأ مؤقت بالشبكة
      });

    // نبضة دورية تحدّث "آخر ظهور" للمستخدم الحالي - أساس ميزة "الموظفين أونلاين"
    this.heartbeatSub = interval(45000)
      .pipe(startWith(0), switchMap(() => this.auth.heartbeat()))
      .subscribe({ error: () => {} });
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    this.heartbeatSub?.unsubscribe();
  }

  goToProducts() {
    this.showDropdown = false;
    this.router.navigate(['/products']);
  }
}
