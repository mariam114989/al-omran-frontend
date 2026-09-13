import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { InventoryService, StockReportRow, CurrentStockRow } from '../../core/services/inventory.service';

type Mode = 'current' | 'monthly' | 'yearly';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <main class="main-area">
        <div class="topbar">
          <div>
            <h2>الجرد</h2>
            <div class="sub">شو ضل بالمخزون، وكم انباع خلال أي فترة</div>
          </div>
        </div>

        <div class="mode-tabs">
          <div class="tab" [class.active]="mode==='current'" (click)="switchMode('current')">📦 الحالة الحالية</div>
          <div class="tab" [class.active]="mode==='monthly'" (click)="switchMode('monthly')">📅 جرد شهري</div>
          <div class="tab" [class.active]="mode==='yearly'" (click)="switchMode('yearly')">🗓️ جرد سنوي</div>
        </div>

        <div class="panel filters-panel">
          <div class="filters-row">
            <div class="field" *ngIf="mode==='monthly'">
              <label>الشهر</label>
              <select [(ngModel)]="selectedMonth" (ngModelChange)="load()">
                <option *ngFor="let m of months" [value]="m.value">{{ m.label }}</option>
              </select>
            </div>
            <div class="field" *ngIf="mode==='monthly' || mode==='yearly'">
              <label>السنة</label>
              <select [(ngModel)]="selectedYear" (ngModelChange)="load()">
                <option *ngFor="let y of years" [value]="y">{{ y }}</option>
              </select>
            </div>
            <div class="field grow">
              <label>🔍 بحث عن منتج بالاسم</label>
              <input [(ngModel)]="searchTerm" placeholder="اكتب اسم المادة..." />
            </div>
            <button class="btn-copper export-btn" (click)="exportExcel()">⬇ تصدير Excel</button>
          </div>
        </div>

        <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
        <div class="panel" *ngIf="loading">جاري التحميل...</div>

        <!-- وضع الحالة الحالية -->
        <table class="data-table" *ngIf="mode==='current' && !loading">
          <thead><tr><th>اسم المادة</th><th>الفئة</th><th>الوحدة</th><th>الكمية المتوفرة</th><th>الحالة</th></tr></thead>
          <tbody>
            <tr *ngFor="let row of filteredCurrent()">
              <td class="name">{{ row.name }}</td>
              <td>{{ row.category }}</td>
              <td>{{ row.unit }}</td>
              <td class="num" [class.low]="row.isLow">{{ row.remaining === 0 ? 'خلصت' : (row.remaining | number) }}</td>
              <td><span class="status-pill" [class.low]="row.isLow">{{ row.remaining === 0 ? 'خلصت' : (row.isLow ? 'ناقص' : 'متوفر') }}</span></td>
            </tr>
            <tr *ngIf="!filteredCurrent().length"><td colspan="5" class="no-results">ما فيه نتائج</td></tr>
          </tbody>
        </table>

        <!-- وضع الشهري/السنوي -->
        <table class="data-table" *ngIf="(mode==='monthly' || mode==='yearly') && !loading">
          <thead><tr><th>اسم المادة</th><th>الفئة</th><th>الكمية المباعة</th><th>الكمية المتبقية بالمخزون</th></tr></thead>
          <tbody>
            <tr *ngFor="let row of filteredReport()">
              <td class="name">{{ row.name }}</td>
              <td>{{ row.category }}</td>
              <td class="num sold">{{ row.sold | number }}</td>
              <td class="num">{{ row.remaining === 0 ? 'خلصت' : (row.remaining | number) }}</td>
            </tr>
            <tr *ngIf="!filteredReport().length"><td colspan="4" class="no-results">ما فيه مبيعات مسجّلة بهاي الفترة</td></tr>
          </tbody>
        </table>
      </main>
    </div>
  `,
  styles: [`
    .topbar{margin-bottom:20px;}
    .topbar h2{font-size:22px;}
    .topbar .sub{color:var(--text-dim);font-size:13px;margin-top:2px;}
    .mode-tabs{display:flex;gap:10px;margin-bottom:18px;}
    .tab{background:var(--bg-surface);border:1px solid rgba(14,138,160,0.35);border-radius:8px;padding:10px 18px;font-size:13.5px;cursor:pointer;color:var(--text-dim);}
    .tab.active{background:var(--copper);color:#1a1108;font-weight:700;border-color:var(--copper);}
    .filters-panel{padding:16px 18px;}
    .filters-row{display:flex;gap:14px;align-items:flex-end;}
    .field{margin-bottom:0;}
    .field.grow{flex:1;}
    .export-btn{white-space:nowrap;}
    .low{color:var(--danger);font-weight:700;}
    .sold{color:var(--copper-light);font-weight:600;}
    .status-pill{font-size:10.5px;padding:3px 10px;border-radius:20px;font-weight:600;background:rgba(76,154,106,0.18);color:#3f8a58;}
    .status-pill.low{background:rgba(193,89,75,0.18);color:#c1594b;}
    .no-results{text-align:center;color:var(--text-dim);padding:20px;}
  `],
})
export class InventoryComponent implements OnInit {
  mode: Mode = 'current';
  searchTerm = '';
  loading = false;
  errorMsg = '';

  currentRows: CurrentStockRow[] = [];
  reportRows: StockReportRow[] = [];

  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  years: number[] = [];
  months = [
    { value: 1, label: 'كانون الثاني' }, { value: 2, label: 'شباط' }, { value: 3, label: 'آذار' },
    { value: 4, label: 'نيسان' }, { value: 5, label: 'أيار' }, { value: 6, label: 'حزيران' },
    { value: 7, label: 'تموز' }, { value: 8, label: 'آب' }, { value: 9, label: 'أيلول' },
    { value: 10, label: 'تشرين الأول' }, { value: 11, label: 'تشرين الثاني' }, { value: 12, label: 'كانون الأول' },
  ];

  constructor(private inventorySvc: InventoryService) {
    const nowYear = new Date().getFullYear();
    this.years = [nowYear, nowYear - 1, nowYear - 2];
  }

  ngOnInit() { this.load(); }

  switchMode(m: Mode) {
    this.mode = m;
    this.searchTerm = '';
    this.load();
  }

  load() {
    this.loading = true;
    this.errorMsg = '';
    if (this.mode === 'current') {
      this.inventorySvc.currentStock().subscribe({
        next: (data) => { this.currentRows = data; this.loading = false; },
        error: () => { this.errorMsg = 'تعذر تحميل بيانات الجرد الحالي'; this.loading = false; },
      });
    } else if (this.mode === 'monthly') {
      this.inventorySvc.monthlyReport(this.selectedYear, this.selectedMonth).subscribe({
        next: (data) => { this.reportRows = data; this.loading = false; },
        error: () => { this.errorMsg = 'تعذر تحميل الجرد الشهري'; this.loading = false; },
      });
    } else {
      this.inventorySvc.yearlyReport(this.selectedYear).subscribe({
        next: (data) => { this.reportRows = data; this.loading = false; },
        error: () => { this.errorMsg = 'تعذر تحميل الجرد السنوي'; this.loading = false; },
      });
    }
  }

  filteredCurrent(): CurrentStockRow[] {
    if (!this.searchTerm.trim()) return this.currentRows;
    const term = this.searchTerm.trim().toLowerCase();
    return this.currentRows.filter((r) => r.name.toLowerCase().includes(term));
  }

  filteredReport(): StockReportRow[] {
    if (!this.searchTerm.trim()) return this.reportRows;
    const term = this.searchTerm.trim().toLowerCase();
    return this.reportRows.filter((r) => r.name.toLowerCase().includes(term));
  }

  exportExcel() {
    if (this.mode === 'current') this.inventorySvc.downloadCurrentExcel();
    else if (this.mode === 'monthly') this.inventorySvc.downloadMonthlyExcel(this.selectedYear, this.selectedMonth);
    else this.inventorySvc.downloadYearlyExcel(this.selectedYear);
  }
}
