import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { ProductsService, Product } from '../../core/services/products.service';
import { InvoicesService, InvoiceItemInput } from '../../core/services/invoices.service';

interface LineItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

@Component({
  selector: 'app-invoice-create',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <main class="main-area">
        <div class="topbar">
          <h2>فاتورة جديدة</h2>
        </div>

        <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
        <div class="success-msg" *ngIf="successMsg">{{ successMsg }}</div>

        <div class="panel">
          <h3>نوع العميل</h3>
          <div class="type-toggle">
            <div class="type-opt" [class.active]="type==='REGULAR'" (click)="type='REGULAR'">عميل عادي</div>
            <div class="type-opt" [class.active]="type==='MERCHANT'" (click)="type='MERCHANT'">تاجر</div>
          </div>
          <div class="grid2" *ngIf="type==='MERCHANT'">
            <div class="field"><label>اسم التاجر</label><input [(ngModel)]="merchantName" /></div>
            <div class="field"><label>الهاتف</label><input [(ngModel)]="merchantPhone" /></div>
          </div>
        </div>

        <div class="panel">
          <h3>إضافة صنف</h3>
          <div class="field">
            <label>🔍 بحث عن منتج بالاسم</label>
            <input [(ngModel)]="searchTerm" placeholder="اكتب اسم المادة..." />
          </div>
          <div class="add-row">
            <select [(ngModel)]="pickedProductId" class="grow">
              <option value="">-- اختر منتج ({{ filteredProducts().length }} نتيجة) --</option>
              <option *ngFor="let p of filteredProducts()" [value]="p.id">
                {{ p.name }} — {{ p.unitPrice | number }} ({{ p.stockQuantity === 0 ? 'خلصت' : p.stockQuantity }} بالمخزون)
              </option>
            </select>
            <input type="number" [(ngModel)]="pickedQty" min="1" placeholder="الكمية" class="qty-input" />
            <button class="btn-ghost" (click)="addItem()">إضافة</button>
          </div>
          <div class="hint-msg" *ngIf="addItemMsg">{{ addItemMsg }}</div>
        </div>

        <div class="panel">
          <h3>أصناف الفاتورة</h3>
          <table class="data-table" *ngIf="items.length">
            <thead><tr><th>المادة</th><th>الكمية</th><th>الإفرادي</th><th>الحسم %</th><th>الإجمالي</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let item of items; let i = index">
                <td class="name">{{ item.name }}</td>
                <td class="num">{{ item.quantity | number }}</td>
                <td class="num">{{ item.unitPrice | number }}</td>
                <td class="num">{{ item.discountPercent }}%</td>
                <td class="num">{{ (item.unitPrice * item.quantity) | number:'1.0-2' }}</td>
                <td><span class="rm" (click)="items.splice(i,1)">✕</span></td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="!items.length" class="muted">⚠️ ما فيه أصناف مضافة بعد — لازم تضيف صنف واحد على الأقل قبل التأكيد.</p>
        </div>

        <div class="panel">
          <div class="summary-row total"><span>الإجمالي التقريبي</span><span class="num">{{ estimatedTotal() | number:'1.0-2' }}</span></div>
          <p class="muted small">السعر النهائي بيتحسب رسميًا من السيرفر وقت التأكيد.</p>
          <button class="btn-copper full" (click)="submit()">
            {{ submitting ? '...جاري الحفظ' : '✓ تأكيد الفاتورة' }}
          </button>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .topbar{margin-bottom:24px;}
    .topbar h2{font-size:22px;}
    .type-toggle{display:flex;gap:10px;margin-bottom:16px;}
    .type-opt{flex:1;border:1px solid rgba(14,138,160,0.4);border-radius:8px;padding:12px;text-align:center;font-size:13px;cursor:pointer;color:var(--text-dim);}
    .type-opt.active{background:rgba(192,139,42,0.15);border-color:var(--copper);color:var(--copper-light);font-weight:700;}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    .add-row{display:flex;gap:10px;align-items:center;}
    .add-row select, .add-row input{background:var(--bg-surface-2);border:1px solid rgba(14,138,160,0.4);border-radius:7px;padding:10px 12px;color:var(--text-light);font-size:13px;}
    .grow{flex:1;}
    .qty-input{width:90px;}
    .rm{color:var(--danger);cursor:pointer;}
    .summary-row.total{display:flex;justify-content:space-between;font-size:18px;font-weight:700;margin-bottom:6px;}
    .summary-row.total .num{color:var(--copper-light);}
    .muted{color:var(--text-dim);font-size:12.5px;}
    .muted.small{font-size:11px;margin-bottom:14px;}
    .btn-copper.full{width:100%;}
    .hint-msg{color:var(--warning);font-size:12px;margin-top:8px;}
    .success-msg{background:rgba(76,154,106,0.15);border:1px solid rgba(76,154,106,0.4);color:#a8e0b8;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:14px;}
  `],
})
export class InvoiceCreateComponent implements OnInit {
  products: Product[] = [];
  items: LineItem[] = [];
  type: 'REGULAR' | 'MERCHANT' = 'REGULAR';
  merchantName = '';
  merchantPhone = '';
  pickedProductId = '';
  pickedQty = 1;
  searchTerm = '';
  errorMsg = '';
  successMsg = '';
  addItemMsg = '';
  submitting = false;

  constructor(private productsSvc: ProductsService, private invoicesSvc: InvoicesService, private router: Router) {}

  ngOnInit() {
    this.productsSvc.findAll().subscribe({
      next: (data) => (this.products = data),
      error: (err) => {
        console.error('فشل تحميل المنتجات:', err);
        this.errorMsg = 'تعذر تحميل قائمة المنتجات - تأكد إنو الباك اند شغال';
      },
    });
  }

  // البحث بالاسم - بيفلتر القائمة مباشرة أثناء الكتابة
  filteredProducts(): Product[] {
    if (!this.searchTerm.trim()) return this.products;
    const term = this.searchTerm.trim().toLowerCase();
    return this.products.filter((p) => p.name.toLowerCase().includes(term));
  }

  addItem() {
    this.addItemMsg = '';
    if (!this.pickedProductId) {
      this.addItemMsg = 'اختر منتج أول من القائمة قبل ما تضغط إضافة';
      return;
    }
    if (!this.pickedQty || this.pickedQty < 1) {
      this.addItemMsg = 'الكمية لازم تكون رقم أكبر من صفر';
      return;
    }
    const product = this.products.find((p) => p.id === this.pickedProductId);
    if (!product) {
      this.addItemMsg = 'المنتج المختار غير موجود، جرب تختار من جديد';
      return;
    }
    if (this.pickedQty > product.stockQuantity) {
      this.addItemMsg = `الكمية المتوفرة من "${product.name}" بالمخزون هي ${product.stockQuantity} فقط`;
      return;
    }
    this.items.push({
      productId: product.id,
      name: product.name,
      quantity: this.pickedQty,
      unitPrice: product.unitPrice,
      discountPercent: product.discountPercent,
    });
    this.pickedProductId = '';
    this.pickedQty = 1;
    this.searchTerm = '';
  }

  estimatedTotal(): number {
    return this.items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  }

  submit() {
    this.errorMsg = '';
    this.successMsg = '';

    // تحقق واضح قبل الإرسال - ما في زر "معطّل بصمت" هون
    if (!this.items.length) {
      this.errorMsg = 'لازم تضيف صنف واحد على الأقل قبل تأكيد الفاتورة';
      return;
    }
    if (this.type === 'MERCHANT' && !this.merchantName.trim()) {
      this.errorMsg = 'اسم التاجر مطلوب لفواتير نوع "تاجر"';
      return;
    }
    if (this.submitting) return;

    this.submitting = true;
    const payload = {
      type: this.type,
      merchantName: this.type === 'MERCHANT' ? this.merchantName : undefined,
      merchantPhone: this.type === 'MERCHANT' ? this.merchantPhone : undefined,
      items: this.items.map((it): InvoiceItemInput => ({ productId: it.productId, quantity: it.quantity })),
    };

    console.log('إرسال الفاتورة:', payload);

    this.invoicesSvc.create(payload).subscribe({
      next: (res) => {
        console.log('نجح إنشاء الفاتورة:', res);
        this.submitting = false;
        this.successMsg = `تم إنشاء الفاتورة رقم ${res.invoiceNumber} بنجاح`;
        setTimeout(() => this.router.navigate(['/invoices']), 800);
      },
      error: (err) => {
        console.error('فشل إنشاء الفاتورة:', err);
        this.submitting = false;
        this.errorMsg = err?.error?.message || err?.message || 'تعذر إنشاء الفاتورة - راجع الـ Console (F12) للتفاصيل';
      },
    });
  }
}
