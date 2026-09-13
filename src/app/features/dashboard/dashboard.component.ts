import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { ProductsService, Product } from '../../core/services/products.service';
import { InvoicesService } from '../../core/services/invoices.service';
import { SalesService, TodayTotals, DailyActivityRow } from '../../core/services/sales.service';
import { EmployeesService, OnlineEmployee, EmployeeSalesSummary } from '../../core/services/employees.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <main class="main-area">
        <div class="topbar">
          <div>
            <h2>لوحة التحكم الرئيسية</h2>
            <div class="sub">نظرة عامة على المخزون والمبيعات والفواتير</div>
          </div>
          <div class="actions">
            <a routerLink="/sales" class="btn-ghost">+ عملية بيع</a>
            <a routerLink="/invoices/new" class="btn-copper">+ فاتورة جديدة</a>
          </div>
        </div>

        <div class="kpi-row">
          <div class="kpi-card">
            <div class="label">إجمالي المنتجات</div>
            <div class="value num">{{ products.length }}</div>
          </div>
          <div class="kpi-card">
            <div class="label">مبيعات اليوم (ل.س)</div>
            <div class="value num">{{ (todayTotals?.syp ?? 0) | number }}</div>
          </div>
          <div class="kpi-card">
            <div class="label">مبيعات اليوم ($)</div>
            <div class="value num">{{ (todayTotals?.usd ?? 0) | number:'1.0-2' }}</div>
          </div>
          <div class="kpi-card">
            <div class="label">أصناف تحت حد الطلب</div>
            <div class="value num">{{ lowStock.length }}</div>
          </div>
          <div class="kpi-card" *ngIf="auth.isManagement()">
            <div class="label">عدد الفاتحين النظام الآن</div>
            <div class="value num">{{ onlineEmployees.length }}</div>
          </div>
        </div>

        <div class="content-grid">
          <div class="panel">
            <h3>حركة آخر 7 أيام</h3>
            <div class="chart" *ngIf="dailyActivity.length">
              <div class="bar-col" *ngFor="let d of dailyActivity">
                <div class="bars">
                  <div class="bar invoices" [style.height.%]="barHeight(d.invoicesCount)" [title]="'فواتير: ' + d.invoicesCount"></div>
                  <div class="bar sales" [style.height.%]="barHeight(d.salesCount)" [title]="'مبيعات: ' + d.salesCount"></div>
                </div>
                <div class="bar-label">{{ shortDate(d.date) }}</div>
              </div>
            </div>
            <div class="legend">
              <span><span class="dot invoices"></span> فواتير</span>
              <span><span class="dot sales"></span> مبيعات سريعة</span>
            </div>
          </div>

          <div class="panel">
            <h3>👥 الموظفون أونلاين الآن</h3>
            <div class="online-list" *ngIf="onlineEmployees.length; else noOnline">
              <div class="online-item" *ngFor="let e of onlineEmployees">
                <span class="online-dot"></span>
                <div>
                  <div class="e-name">{{ e.name }}</div>
                  <div class="e-role">{{ e.role === 'ADMIN' ? 'مدير' : e.role === 'MANAGER' ? 'مشرف' : 'موظف' }}</div>
                </div>
              </div>
            </div>
            <ng-template #noOnline><p class="muted">ما فيه موظف أونلاين حاليًا</p></ng-template>
          </div>
        </div>

        <div class="panel" *ngIf="lowStock.length">
          <h3>⚠️ تنبيه نواقص المخزون</h3>
          <table class="data-table">
            <thead><tr><th>اسم المادة</th><th>الكمية المتبقية</th><th>حد التنبيه</th></tr></thead>
            <tbody>
              <tr *ngFor="let p of lowStock">
                <td class="name">{{ p.name }}</td>
                <td class="num">{{ p.stockQuantity }}</td>
                <td class="num">{{ p.minStockAlert }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="panel" *ngIf="auth.isManagement() && salesSummary.length">
          <h3>📊 شو باع كل موظف</h3>
          <table class="data-table">
            <thead>
              <tr><th>الموظف</th><th>فواتير</th><th>قطع (فواتير)</th><th>مبيعات سريعة</th><th>قطع (مبيعات)</th><th>إجمالي ل.س</th><th>إجمالي $</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of salesSummary">
                <td class="name">{{ e.name }}</td>
                <td class="num">{{ e.invoicesCount }}</td>
                <td class="num">{{ e.invoicesPieces }}</td>
                <td class="num">{{ e.salesCount }}</td>
                <td class="num">{{ e.salesPieces }}</td>
                <td class="num">{{ e.sypTotal | number }}</td>
                <td class="num">{{ e.usdTotal | number:'1.0-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="panel" *ngIf="loading">جاري تحميل البيانات...</div>
        <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
      </main>
    </div>
  `,
  styles: [`
    .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;}
    .topbar h2{font-size:22px;}
    .topbar .sub{color:var(--text-dim);font-size:13px;margin-top:2px;}
    .actions{display:flex;gap:10px;}
    .kpi-row{display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:18px;margin-bottom:26px;}
    .kpi-card{background:var(--bg-surface);border:1px solid rgba(14,138,160,0.3);border-radius:12px;padding:18px 20px;position:relative;}
    .kpi-card::before{content:'';position:absolute;top:0;right:0;width:4px;height:100%;background:var(--copper);}
    .kpi-card .label{font-size:12.5px;color:var(--text-dim);margin-bottom:8px;}
    .kpi-card .value{font-size:24px;font-weight:600;}

    .content-grid{display:grid;grid-template-columns:1.4fr 1fr;gap:20px;margin-bottom:20px;}

    .chart{display:flex;align-items:flex-end;gap:10px;height:140px;padding:0 4px;}
    .bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;height:100%;justify-content:flex-end;}
    .bars{display:flex;gap:3px;align-items:flex-end;height:110px;width:100%;justify-content:center;}
    .bar{width:10px;border-radius:3px 3px 0 0;min-height:2px;}
    .bar.invoices{background:var(--copper);}
    .bar.sales{background:var(--line-cyan);}
    .bar-label{font-size:10px;color:var(--text-dim);}
    .legend{display:flex;gap:16px;margin-top:14px;font-size:11.5px;color:var(--text-dim);}
    .legend .dot{display:inline-block;width:8px;height:8px;border-radius:2px;margin-left:4px;}
    .legend .dot.invoices{background:var(--copper);}
    .legend .dot.sales{background:var(--line-cyan);}

    .online-list{display:flex;flex-direction:column;gap:10px;}
    .online-item{display:flex;align-items:center;gap:10px;}
    .online-dot{width:9px;height:9px;border-radius:50%;background:var(--success);flex-shrink:0;box-shadow:0 0 6px var(--success);}
    .e-name{font-size:13px;}
    .e-role{font-size:11px;color:var(--text-dim);}
    .muted{color:var(--text-dim);font-size:12.5px;}
  `],
})
export class DashboardComponent implements OnInit {
  products: Product[] = [];
  lowStock: Product[] = [];
  invoicesCount = 0;
  loading = true;
  errorMsg = '';

  todayTotals: TodayTotals | null = null;
  dailyActivity: DailyActivityRow[] = [];
  onlineEmployees: OnlineEmployee[] = [];
  salesSummary: EmployeeSalesSummary[] = [];
  maxDailyCount = 1;

  constructor(
    private productsSvc: ProductsService,
    private invoicesSvc: InvoicesService,
    private salesSvc: SalesService,
    private employeesSvc: EmployeesService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.productsSvc.findAll().subscribe({
      next: (data) => {
        this.products = data;
        this.lowStock = data.filter((p) => p.stockQuantity <= p.minStockAlert);
        this.loading = false;
      },
      error: () => { this.errorMsg = 'تعذر الاتصال بالسيرفر'; this.loading = false; },
    });

    this.invoicesSvc.findAll().subscribe({ next: (data) => (this.invoicesCount = data.length) });

    this.salesSvc.todayTotals().subscribe({ next: (data) => (this.todayTotals = data) });

    this.salesSvc.dailyActivity(7).subscribe({
      next: (data) => {
        this.dailyActivity = data;
        this.maxDailyCount = Math.max(1, ...data.map((d) => Math.max(d.invoicesCount, d.salesCount)));
      },
    });

    // الموظفين أونلاين وملخص المبيعات متاحين بس للمدير/المشرف بالباك اند
    if (this.auth.isManagement()) {
      this.employeesSvc.findOnline().subscribe({ next: (data) => (this.onlineEmployees = data), error: () => {} });
      this.employeesSvc.salesSummary().subscribe({ next: (data) => (this.salesSummary = data), error: () => {} });
    }
  }

  barHeight(count: number): number {
    return Math.max(4, (count / this.maxDailyCount) * 100);
  }

  shortDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
}
