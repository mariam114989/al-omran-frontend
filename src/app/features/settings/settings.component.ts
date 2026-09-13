import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { SettingsService, Category, CurrencySetting } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <main class="main-area">
        <div class="topbar"><h2>الإعدادات</h2></div>

        <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
        <div class="success-msg" *ngIf="successMsg">{{ successMsg }}</div>

        <!-- ==== فئات المنتجات ==== -->
        <div class="panel">
          <h3>فئات المنتجات</h3>
          <p class="hint-text">أضف أي فئة جديدة غير "صحية" و"كهربائية"، أو عدّل اسم فئة موجودة (بينعكس تلقائيًا على كل منتجاتها).</p>

          <div class="add-row">
            <input [(ngModel)]="newCategoryName" placeholder="اسم فئة جديدة..." (keyup.enter)="addCategory()" />
            <button class="btn-copper" (click)="addCategory()">+ إضافة</button>
          </div>

          <table class="data-table">
            <thead><tr><th>الفئة</th><th>إجراءات</th></tr></thead>
            <tbody>
              <tr *ngFor="let c of categories">
                <td>
                  <input *ngIf="editingCategoryId === c.id" [(ngModel)]="editingCategoryName" (keyup.enter)="saveCategory(c)" />
                  <span *ngIf="editingCategoryId !== c.id">{{ c.name }}</span>
                </td>
                <td class="row-actions">
                  <ng-container *ngIf="editingCategoryId === c.id; else viewActions">
                    <button class="link-btn" (click)="saveCategory(c)">حفظ</button>
                    <button class="link-btn" (click)="editingCategoryId = null">إلغاء</button>
                  </ng-container>
                  <ng-template #viewActions>
                    <button class="link-btn" (click)="startEditCategory(c)">تعديل</button>
                    <button class="link-btn danger" (click)="deleteCategory(c)">حذف</button>
                  </ng-template>
                </td>
              </tr>
              <tr *ngIf="!categories.length"><td colspan="2" class="no-results">لا يوجد فئات بعد</td></tr>
            </tbody>
          </table>
        </div>

        <!-- ==== إعدادات العملات ==== -->
        <div class="panel">
          <h3>إعدادات العملات وسعر الصرف</h3>
          <p class="hint-text">
            الليرة السورية هي العملة الأساسية دائمًا (سعر صرفها = 1). كل عملة تانية إلها سعر صرف منفصل مقابل الليرة -
            أي مستخدم (مدير أو موظف) يقدر يضيف عملة جديدة أو يعدّل سعرها من هون.
          </p>

          <div class="add-row grid3">
            <input [(ngModel)]="newCurrency.code" placeholder="رمز العملة (مثال: EUR)" />
            <input [(ngModel)]="newCurrency.name" placeholder="الاسم (مثال: يورو)" />
            <input type="number" [(ngModel)]="newCurrency.rate" placeholder="سعر الصرف مقابل الليرة" />
          </div>
          <button class="btn-copper" (click)="addCurrency()">+ إضافة عملة</button>

          <table class="data-table" style="margin-top:16px;">
            <thead><tr><th>الرمز</th><th>الاسم</th><th>سعر الصرف (مقابل الليرة)</th><th>إجراءات</th></tr></thead>
            <tbody>
              <tr *ngFor="let c of currencies">
                <td>{{ c.code }}</td>
                <td>{{ c.name }}</td>
                <td class="num">
                  <span *ngIf="c.isBase">1 (ثابتة)</span>
                  <input *ngIf="!c.isBase && editingCurrencyCode === c.code" type="number" [(ngModel)]="editingCurrencyRate" />
                  <span *ngIf="!c.isBase && editingCurrencyCode !== c.code">{{ c.rate | number:'1.0-4' }}</span>
                </td>
                <td class="row-actions" *ngIf="!c.isBase">
                  <ng-container *ngIf="editingCurrencyCode === c.code; else viewCurrencyActions">
                    <button class="link-btn" (click)="saveCurrencyRate(c)">حفظ</button>
                    <button class="link-btn" (click)="editingCurrencyCode = null">إلغاء</button>
                  </ng-container>
                  <ng-template #viewCurrencyActions>
                    <button class="link-btn" (click)="startEditCurrency(c)">تعديل السعر</button>
                    <button class="link-btn danger" (click)="deleteCurrency(c)">حذف</button>
                  </ng-template>
                </td>
                <td *ngIf="c.isBase"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .topbar{margin-bottom:24px;}
    .topbar h2{font-size:22px;}
    .hint-text{color:var(--text-dim);font-size:12.5px;margin-bottom:14px;line-height:1.7;}
    .add-row{display:flex;gap:10px;margin-bottom:14px;}
    .add-row input{flex:1;background:var(--bg-surface-2);border:1px solid rgba(14,138,160,0.4);border-radius:7px;padding:10px 14px;color:var(--text-light);font-size:13.5px;}
    .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
    .row-actions{display:flex;gap:10px;white-space:nowrap;}
    .link-btn{background:none;border:none;color:var(--line-cyan);font-size:12px;text-decoration:underline;cursor:pointer;}
    .link-btn.danger{color:var(--danger);}
    .no-results{text-align:center;color:var(--text-dim);padding:16px;}
    .success-msg{background:rgba(76,154,106,0.15);border:1px solid rgba(76,154,106,0.4);color:#a8e0b8;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:14px;}
  `],
})
export class SettingsComponent implements OnInit {
  categories: Category[] = [];
  currencies: CurrencySetting[] = [];
  errorMsg = '';
  successMsg = '';

  newCategoryName = '';
  editingCategoryId: string | null = null;
  editingCategoryName = '';

  newCurrency = { code: '', name: '', rate: 0 };
  editingCurrencyCode: string | null = null;
  editingCurrencyRate = 0;

  constructor(private settingsSvc: SettingsService) {}

  ngOnInit() {
    this.loadCategories();
    this.loadCurrencies();
  }

  loadCategories() {
    this.settingsSvc.findCategories().subscribe({ next: (data) => (this.categories = data) });
  }

  loadCurrencies() {
    this.settingsSvc.findCurrencies().subscribe({ next: (data) => (this.currencies = data) });
  }

  notify(success: string) {
    this.successMsg = success;
    this.errorMsg = '';
  }

  fail(err: any, fallback: string) {
    this.errorMsg = err?.error?.message || fallback;
    this.successMsg = '';
  }

  addCategory() {
    if (!this.newCategoryName.trim()) return;
    this.settingsSvc.createCategory(this.newCategoryName.trim()).subscribe({
      next: () => { this.notify('تمت إضافة الفئة'); this.newCategoryName = ''; this.loadCategories(); },
      error: (err) => this.fail(err, 'تعذر إضافة الفئة'),
    });
  }

  startEditCategory(c: Category) {
    this.editingCategoryId = c.id;
    this.editingCategoryName = c.name;
  }

  saveCategory(c: Category) {
    if (!this.editingCategoryName.trim()) return;
    this.settingsSvc.updateCategory(c.id, this.editingCategoryName.trim()).subscribe({
      next: () => { this.notify('تم تعديل الفئة'); this.editingCategoryId = null; this.loadCategories(); },
      error: (err) => this.fail(err, 'تعذر تعديل الفئة'),
    });
  }

  deleteCategory(c: Category) {
    if (!confirm(`تأكيد حذف فئة "${c.name}"؟`)) return;
    this.settingsSvc.deleteCategory(c.id).subscribe({
      next: () => { this.notify('تم حذف الفئة'); this.loadCategories(); },
      error: (err) => this.fail(err, 'تعذر حذف الفئة'),
    });
  }

  addCurrency() {
    if (!this.newCurrency.code.trim() || !this.newCurrency.name.trim() || !this.newCurrency.rate) {
      this.errorMsg = 'عبّي رمز العملة والاسم وسعر الصرف';
      return;
    }
    this.settingsSvc.createCurrency(this.newCurrency.code.trim(), this.newCurrency.name.trim(), this.newCurrency.rate).subscribe({
      next: () => { this.notify('تمت إضافة العملة'); this.newCurrency = { code: '', name: '', rate: 0 }; this.loadCurrencies(); },
      error: (err) => this.fail(err, 'تعذر إضافة العملة'),
    });
  }

  startEditCurrency(c: CurrencySetting) {
    this.editingCurrencyCode = c.code;
    this.editingCurrencyRate = c.rate;
  }

  saveCurrencyRate(c: CurrencySetting) {
    this.settingsSvc.updateCurrencyRate(c.code, this.editingCurrencyRate).subscribe({
      next: () => { this.notify('تم تعديل سعر الصرف'); this.editingCurrencyCode = null; this.loadCurrencies(); },
      error: (err) => this.fail(err, 'تعذر تعديل سعر الصرف'),
    });
  }

  deleteCurrency(c: CurrencySetting) {
    if (!confirm(`تأكيد حذف عملة "${c.name}"؟`)) return;
    this.settingsSvc.deleteCurrency(c.code).subscribe({
      next: () => { this.notify('تم حذف العملة'); this.loadCurrencies(); },
      error: (err) => this.fail(err, 'تعذر حذف العملة'),
    });
  }
}
