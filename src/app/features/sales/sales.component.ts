import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { ProductsService, Product } from '../../core/services/products.service';
import { SalesService } from '../../core/services/sales.service';
import { SettingsService, CurrencySetting } from '../../core/services/settings.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <main class="main-area">
        <div class="topbar">
          <h2>المبيعات</h2>
          <div class="sub">سجل بيع سريع - تدخل الصنف، الكمية، والسعر يدويًا (منفصل عن نظام الفواتير الرسمي)</div>
        </div>

        <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
        <div class="success-msg" *ngIf="successMsg">{{ successMsg }}</div>

        <div class="panel">
          <h3>عملية بيع جديدة</h3>

          <div class="field">
            <label>🔍 بحث عن منتج بالاسم</label>
            <input [(ngModel)]="searchTerm" placeholder="اكتب اسم المادة..." />
          </div>

          <div class="field">
            <label>الصنف</label>
            <select [(ngModel)]="selectedProductId" (ngModelChange)="onProductPick()">
              <option value="">-- اختر منتج ({{ filteredProducts().length }} نتيجة) --</option>
              <option *ngFor="let p of filteredProducts()" [value]="p.id">
                {{ p.name }} — متوفر: {{ p.stockQuantity === 0 ? 'خلصت' : p.stockQuantity }}
              </option>
            </select>
          </div>

          <div class="grid3">
            <div class="field">
              <label>الكمية</label>
              <input type="number" [(ngModel)]="quantity" min="1" />
            </div>
            <div class="field">
              <label>السعر (للقطعة الواحدة)</label>
              <input type="number" [(ngModel)]="price" min="0" />
            </div>
            <div class="field">
              <label>العملة</label>
              <div class="currency-toggle">
                <div class="opt" *ngFor="let c of currencies" [class.active]="currency===c.code" (click)="currency=c.code">
                  {{ c.name }}
                </div>
                <button class="opt add-currency" type="button" (click)="showAddCurrency = !showAddCurrency">+ عملة جديدة</button>
              </div>
            </div>
          </div>

          <!-- إضافة عملة جديدة مع سعر صرفها مباشرة من هون -->
          <div class="add-currency-panel" *ngIf="showAddCurrency">
            <div class="grid3">
              <div class="field"><label>رمز العملة</label><input [(ngModel)]="newCurrency.code" placeholder="مثال: EUR" /></div>
              <div class="field"><label>الاسم</label><input [(ngModel)]="newCurrency.name" placeholder="مثال: يورو" /></div>
              <div class="field"><label>سعر الصرف (مقابل الليرة السورية)</label><input type="number" [(ngModel)]="newCurrency.rate" /></div>
            </div>
            <button class="btn-copper" (click)="addCurrency()">إضافة العملة</button>
          </div>

          <div class="total-preview" *ngIf="quantity && price">
            الإجمالي: <span class="num">{{ (quantity * price) | number:'1.0-2' }}</span> {{ currencyLabel() }}
          </div>

          <button class="btn-copper" (click)="submit()">
            {{ submitting ? '...جاري الحفظ' : '✓ تسجيل عملية البيع' }}
          </button>
        </div>

        <div class="panel">
          <h3>آخر المبيعات</h3>
          <table class="data-table" *ngIf="sales.length">
            <thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th><th>العملة</th><th>الموظف</th><th>الوقت</th></tr></thead>
            <tbody>
              <tr *ngFor="let s of sales">
                <td class="name">{{ s.productName }}</td>
                <td class="num">{{ s.quantity | number }}</td>
                <td class="num">{{ s.price | number:'1.0-2' }}</td>
                <td class="num">{{ s.total | number:'1.0-2' }}</td>
                <td>{{ s.currency }}</td>
                <td>{{ s.employee?.name }}</td>
                <td class="num">{{ s.createdAt | date: 'yyyy/MM/dd HH:mm' }}</td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="!sales.length" class="muted">ما فيه مبيعات مسجّلة بعد</p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .topbar{margin-bottom:22px;}
    .topbar h2{font-size:22px;}
    .topbar .sub{color:var(--text-dim);font-size:12.5px;margin-top:4px;}
    .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
    .currency-toggle{display:flex;gap:8px;flex-wrap:wrap;}
    .opt{flex:1;min-width:90px;background:var(--bg-surface-2);border:1px solid rgba(14,138,160,0.4);border-radius:7px;padding:10px 8px;text-align:center;font-size:12.5px;cursor:pointer;color:var(--text-dim);}
    .opt.active{background:rgba(192,139,42,0.15);border-color:var(--copper);color:var(--copper-light);font-weight:700;}
    .add-currency{border-style:dashed;color:var(--line-cyan);}
    .add-currency-panel{background:var(--bg-surface-2);border:1px dashed rgba(14,138,160,0.4);border-radius:8px;padding:14px;margin:12px 0;}
    .total-preview{background:var(--bg-surface-2);border-radius:8px;padding:12px 16px;margin:16px 0;font-size:15px;font-weight:700;}
    .total-preview .num{color:var(--copper-light);}
    .success-msg{background:rgba(76,154,106,0.15);border:1px solid rgba(76,154,106,0.4);color:#a8e0b8;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:14px;}
    .muted{color:var(--text-dim);font-size:12.5px;padding:10px 0;}
  `],
})
export class SalesComponent implements OnInit {
  products: Product[] = [];
  sales: any[] = [];
  currencies: CurrencySetting[] = [];
  searchTerm = '';
  selectedProductId = '';
  quantity = 1;
  price = 0;
  currency = 'SYP';
  submitting = false;
  errorMsg = '';
  successMsg = '';

  showAddCurrency = false;
  newCurrency = { code: '', name: '', rate: 0 };

  constructor(private productsSvc: ProductsService, private salesSvc: SalesService, private settingsSvc: SettingsService) {}

  ngOnInit() {
    this.productsSvc.findAll().subscribe({ next: (data) => (this.products = data) });
    this.loadCurrencies();
    this.loadSales();
  }

  loadCurrencies() {
    this.settingsSvc.findCurrencies().subscribe({ next: (data) => (this.currencies = data) });
  }

  loadSales() {
    this.salesSvc.findAll().subscribe({ next: (data) => (this.sales = data.slice(0, 20)) });
  }

  filteredProducts(): Product[] {
    if (!this.searchTerm.trim()) return this.products;
    const term = this.searchTerm.trim().toLowerCase();
    return this.products.filter((p) => p.name.toLowerCase().includes(term));
  }

  currencyLabel(): string {
    return this.currencies.find((c) => c.code === this.currency)?.name || this.currency;
  }

  // لما يختار منتج، منعبّي السعر تلقائيًا من سعر المنتج كنقطة بداية - وبيقدر يعدله يدويًا بعدين
  onProductPick() {
    const product = this.products.find((p) => p.id === this.selectedProductId);
    if (product) this.price = product.unitPrice;
  }

  addCurrency() {
    if (!this.newCurrency.code.trim() || !this.newCurrency.name.trim() || !this.newCurrency.rate) {
      this.errorMsg = 'عبّي رمز العملة والاسم وسعر الصرف';
      return;
    }
    this.settingsSvc.createCurrency(this.newCurrency.code.trim(), this.newCurrency.name.trim(), this.newCurrency.rate).subscribe({
      next: (c) => {
        this.errorMsg = '';
        this.successMsg = `تم إضافة عملة ${c.name}`;
        this.newCurrency = { code: '', name: '', rate: 0 };
        this.showAddCurrency = false;
        this.loadCurrencies();
        this.currency = c.code;
      },
      error: (err) => (this.errorMsg = err?.error?.message || 'تعذر إضافة العملة'),
    });
  }

  submit() {
    this.errorMsg = '';
    this.successMsg = '';
    if (!this.selectedProductId) { this.errorMsg = 'اختر منتج أول'; return; }
    if (!this.quantity || this.quantity < 1) { this.errorMsg = 'الكمية لازم تكون أكبر من صفر'; return; }
    if (!this.price || this.price < 0) { this.errorMsg = 'أدخل سعر صحيح'; return; }
    if (this.submitting) return;

    this.submitting = true;
    this.salesSvc.create({
      productId: this.selectedProductId,
      quantity: this.quantity,
      price: this.price,
      currency: this.currency,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.successMsg = 'تم تسجيل عملية البيع بنجاح';
        this.selectedProductId = '';
        this.quantity = 1;
        this.price = 0;
        this.searchTerm = '';
        this.loadSales();
        this.productsSvc.findAll().subscribe({ next: (data) => (this.products = data) });
      },
      error: (err) => {
        this.submitting = false;
        this.errorMsg = err?.error?.message || 'تعذر تسجيل عملية البيع';
      },
    });
  }
}
