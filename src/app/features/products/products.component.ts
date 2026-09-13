import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { ProductsService, Product, ExtractedRow } from '../../core/services/products.service';
import { SettingsService, Category, CurrencySetting } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';

interface ReviewRow {
  include: boolean;
  rawLine: string;
  numbersHint: string;
  name: string;
  category: string;
  unit: string;
  totalPrice: number;
  unitPrice: number;
  discountPercent: number;
  stockQuantity: number;
  minStockAlert: number;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <main class="main-area">
        <div class="topbar">
          <h2>المنتجات</h2>
          <div class="actions">
            <label class="btn-ghost file-btn">
              📄 استيراد من PDF
              <input type="file" accept="application/pdf" (change)="onFileSelected($event, 'pdf')" hidden />
            </label>
            <label class="btn-ghost file-btn">
              📊 استيراد من إكسل
              <input type="file" accept=".xlsx,.xls" (change)="onFileSelected($event, 'excel')" hidden />
            </label>
            <button class="btn-copper" (click)="showForm = !showForm; editingId = null" *ngIf="auth.isManagement()">
              {{ showForm ? 'إغلاق' : '+ إضافة منتج' }}
            </button>
          </div>
        </div>

        <div class="panel" *ngIf="showForm">
          <h3>{{ editingId ? 'تعديل منتج' : 'منتج جديد' }}</h3>
          <div class="grid2">
            <div class="field"><label>اسم المادة</label><input [(ngModel)]="form.name" /></div>
            <div class="field">
              <label>الفئة</label>
              <input [(ngModel)]="form.category" list="category-options" placeholder="اكتب فئة جديدة أو اختر من المقترحات" />
            </div>
            <div class="field"><label>الوحدة</label><input [(ngModel)]="form.unit" placeholder="قطعة" /></div>
            <div class="field"><label>السعر الاجمالي</label><input type="number" [(ngModel)]="form.totalPrice" /></div>
            <div class="field"><label>السعر الإفرادي</label><input type="number" [(ngModel)]="form.unitPrice" /></div>
            <div class="field"><label>الكمية بالمخزون</label><input type="number" [(ngModel)]="form.stockQuantity" /></div>
            <div class="field"><label>حد التنبيه</label><input type="number" [(ngModel)]="form.minStockAlert" /></div>
          </div>
          <div class="form-actions">
            <button class="btn-copper" (click)="save()">{{ editingId ? 'حفظ التعديلات' : 'حفظ المنتج' }}</button>
            <button class="btn-ghost" *ngIf="editingId" (click)="cancelEdit()">إلغاء</button>
          </div>
        </div>

        <!-- لوحة مراجعة الاستيراد (PDF أو إكسل) -->
        <div class="panel import-panel" *ngIf="importRows.length || importLoading">
          <h3>{{ importSource === 'excel' ? '📊' : '📄' }} مراجعة الأصناف المستخرجة {{ importSource === 'excel' ? 'من ملف الإكسل' : 'من الفاتورة' }}</h3>
          <p class="hint-text">
            راجع كل صف وصحّح الأرقام قبل الحفظ - الاستخراج التلقائي تخميني وممكن يخلط ترتيب الأعمدة.
            الأرقام الأصلية يلي انلقت بالسطر موجودة تحت كل صف كمرجع تساعدك تعبّي الحقول صح.
            <strong>لو الصنف موجود أصلاً بالمخزون، الكمية بتنضاف لرصيده الحالي تلقائيًا (تزويد) بدل ما يتكرر.</strong>
          </p>
          <div class="loading-msg" *ngIf="importLoading">...جاري تحليل الملف</div>

          <div class="currency-picker" *ngIf="importRows.length">
            <label>الفاتورة/الملف مسعّر بعملة:</label>
            <select [(ngModel)]="importCurrency">
              <option *ngFor="let c of currencies" [value]="c.code">{{ c.name }} ({{ c.code }})</option>
            </select>
            <span class="rate-hint" *ngIf="importCurrency !== 'SYP'">
              رح تتحول الأسعار تلقائيًا لليرة السورية حسب سعر الصرف ({{ currencyRate(importCurrency) | number:'1.0-4' }} ل.س لكل {{ importCurrency }})
            </span>
          </div>

          <div class="import-row" *ngFor="let row of importRows; let i = index" [class.excluded]="!row.include">
            <div class="row-top">
              <input type="checkbox" [(ngModel)]="row.include" />
              <span class="raw-line">{{ row.rawLine }}</span>
            </div>
            <div class="numbers-hint" *ngIf="row.numbersHint">الأرقام بالسطر: {{ row.numbersHint }}</div>
            <div class="grid-import">
              <div class="field"><label>اسم المادة</label><input [(ngModel)]="row.name" /></div>
              <div class="field">
                <label>الفئة</label>
                <input [(ngModel)]="row.category" list="category-options" placeholder="اختر أو اكتب فئة" />
              </div>
              <div class="field"><label>الوحدة</label><input [(ngModel)]="row.unit" /></div>
              <div class="field"><label>السعر الاجمالي</label><input type="number" [(ngModel)]="row.totalPrice" /></div>
              <div class="field"><label>الإفرادي</label><input type="number" [(ngModel)]="row.unitPrice" /></div>
              <div class="field"><label>الكمية المستلمة</label><input type="number" [(ngModel)]="row.stockQuantity" /></div>
              <div class="field"><label>حد التنبيه</label><input type="number" [(ngModel)]="row.minStockAlert" /></div>
            </div>
          </div>

          <div class="import-actions" *ngIf="importRows.length">
            <button class="btn-ghost" (click)="cancelImport()">إلغاء</button>
            <button class="btn-copper" (click)="confirmImport()" [disabled]="importing">
              {{ importing ? '...جاري الحفظ' : '✓ تأكيد استيراد ' + selectedCount() + ' صنف' }}
            </button>
          </div>
        </div>

        <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
        <div class="success-msg" *ngIf="successMsg">{{ successMsg }}</div>

        <div class="search-bar">
          <input [(ngModel)]="searchTerm" placeholder="🔍 ابحث عن منتج بالاسم..." />
          <select [(ngModel)]="categoryFilter">
            <option value="">كل الفئات</option>
            <option *ngFor="let c of categories" [value]="c.name">{{ c.name }}</option>
          </select>
          <span class="result-count">{{ filteredProducts().length }} نتيجة</span>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>اسم المادة</th><th>الفئة</th><th>الوحدة</th><th>السعر الاجمالي</th><th>السعر الإفرادي</th><th>المخزون</th>
              <th *ngIf="auth.isManagement()">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filteredProducts()">
              <td class="name">{{ p.name }}</td>
              <td>{{ p.category }}</td>
              <td>{{ p.unit }}</td>
              <td class="num">{{ p.totalPrice | number }}</td>
              <td class="num">{{ p.unitPrice | number }}</td>
              <td class="num" [class.low]="p.stockQuantity <= p.minStockAlert" [class.empty]="p.stockQuantity === 0">
                {{ p.stockQuantity === 0 ? 'خلصت' : (p.stockQuantity | number) }}
              </td>
              <td *ngIf="auth.isManagement()" class="row-actions">
                <button class="link-btn" (click)="startEdit(p)">تعديل</button>
                <button class="link-btn" (click)="openAdjust(p)">تعديل الكمية</button>
              </td>
            </tr>
            <tr *ngIf="!filteredProducts().length">
              <td [attr.colspan]="auth.isManagement() ? 7 : 6" class="no-results">ما فيه نتائج مطابقة للبحث</td>
            </tr>
          </tbody>
        </table>

        <!-- لوحة تعديل الكمية الموجودة (تصحيح جرد سريع) -->
        <div class="modal-backdrop" *ngIf="adjustTarget" (click)="adjustTarget = null">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>تعديل كمية "{{ adjustTarget.name }}"</h3>
            <p class="hint-text">الكمية الحالية: {{ adjustTarget.stockQuantity }} {{ adjustTarget.unit }}</p>
            <div class="field">
              <label>مقدار التعديل (رقم موجب للزيادة، سالب للإنقاص)</label>
              <input type="number" [(ngModel)]="adjustDelta" />
            </div>
            <div class="preview-line" *ngIf="adjustTarget">
              الكمية بعد التعديل: <strong>{{ adjustTarget.stockQuantity + adjustDelta }}</strong>
            </div>
            <div class="form-actions">
              <button class="btn-copper" (click)="confirmAdjust()">حفظ</button>
              <button class="btn-ghost" (click)="adjustTarget = null">إلغاء</button>
            </div>
          </div>
        </div>

        <datalist id="category-options">
          <option *ngFor="let c of categories" [value]="c.name"></option>
        </datalist>
      </main>
    </div>
  `,
  styles: [`
    .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:10px;}
    .topbar h2{font-size:22px;}
    .actions{display:flex;gap:10px;flex-wrap:wrap;}
    .file-btn{cursor:pointer;display:inline-flex;align-items:center;}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    .form-actions{display:flex;gap:10px;margin-top:8px;}
    .low{color:var(--danger);font-weight:700;}
    .empty{color:var(--danger);font-weight:800;}
    .search-bar{display:flex;gap:10px;align-items:center;margin-bottom:16px;}
    .search-bar input{flex:1;background:var(--bg-surface-2);border:1px solid rgba(14,138,160,0.4);border-radius:7px;padding:10px 14px;color:var(--text-light);font-size:13.5px;}
    .search-bar select{background:var(--bg-surface-2);border:1px solid rgba(14,138,160,0.4);border-radius:7px;padding:10px 12px;color:var(--text-light);font-size:13px;}
    .result-count{color:var(--text-dim);font-size:12px;white-space:nowrap;}
    .no-results{text-align:center;color:var(--text-dim);padding:20px;}
    .row-actions{display:flex;gap:10px;white-space:nowrap;}

    .import-panel{border-color:rgba(192,139,42,0.4);}
    .currency-picker{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--bg-surface-2);border:1px dashed rgba(14,138,160,0.4);border-radius:8px;padding:10px 14px;margin-bottom:14px;}
    .currency-picker select{background:var(--bg-deep);border:1px solid rgba(14,138,160,0.4);border-radius:7px;padding:6px 10px;color:var(--text-light);font-size:12.5px;}
    .rate-hint{color:var(--copper-light);font-size:11.5px;}
    .hint-text{color:var(--text-dim);font-size:12px;margin-bottom:16px;line-height:1.7;}
    .loading-msg{color:var(--copper-light);font-size:13px;padding:10px 0;}
    .import-row{background:var(--bg-surface-2);border:1px solid rgba(14,138,160,0.25);border-radius:8px;padding:12px 14px;margin-bottom:12px;}
    .import-row.excluded{opacity:0.45;}
    .row-top{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
    .raw-line{font-size:11.5px;color:var(--text-dim);font-family:'IBM Plex Mono',monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .numbers-hint{font-size:11px;color:var(--copper-light);margin-bottom:10px;}
    .grid-import{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
    .grid-import .field{margin-bottom:0;}
    .import-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:10px;}
    .success-msg{background:rgba(76,154,106,0.15);border:1px solid rgba(76,154,106,0.4);color:#a8e0b8;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:14px;}

    .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:100;}
    .modal{background:var(--bg-surface);border:1px solid rgba(14,138,160,0.4);border-radius:12px;padding:22px;width:360px;max-width:90vw;}
    .modal h3{margin-bottom:6px;}
    .preview-line{margin:10px 0;font-size:13px;color:var(--text-dim);}
  `],
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  showForm = false;
  editingId: string | null = null;
  errorMsg = '';
  successMsg = '';
  searchTerm = '';
  categoryFilter = '';
  form: any = this.emptyForm();

  importRows: ReviewRow[] = [];
  importLoading = false;
  importing = false;
  importSource: 'pdf' | 'excel' = 'pdf';
  currencies: CurrencySetting[] = [];
  importCurrency = 'SYP';

  adjustTarget: Product | null = null;
  adjustDelta = 0;

  constructor(private productsSvc: ProductsService, private settingsSvc: SettingsService, public auth: AuthService) {}

  ngOnInit() {
    this.load();
    this.loadCategories();
    this.loadCurrencies();
  }

  loadCurrencies() {
    this.settingsSvc.findCurrencies().subscribe({ next: (data) => (this.currencies = data) });
  }

  currencyRate(code: string): number {
    return this.currencies.find((c) => c.code === code)?.rate ?? 1;
  }

  emptyForm() {
    return { name: '', category: '', unit: 'قطعة', totalPrice: 0, unitPrice: 0, discountPercent: 0, stockQuantity: 0, minStockAlert: 5 };
  }

  load() {
    this.productsSvc.findAll().subscribe({
      next: (data) => (this.products = data),
      error: () => (this.errorMsg = 'تعذر تحميل المنتجات'),
    });
  }

  // منجيب الفئات من إعدادات الفئات الموحّدة (مو بس المستخرجة من المنتجات) حتى تظهر فئة مضافة حديثًا فورًا
  loadCategories() {
    this.settingsSvc.findCategories().subscribe({ next: (data) => (this.categories = data) });
  }

  filteredProducts(): Product[] {
    return this.products.filter((p) => {
      const matchesSearch = !this.searchTerm.trim() || p.name.toLowerCase().includes(this.searchTerm.trim().toLowerCase());
      const matchesCategory = !this.categoryFilter || p.category === this.categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }

  save() {
    if (!this.form.name) { this.errorMsg = 'اسم المادة مطلوب'; return; }
    if (!this.form.category?.trim()) { this.errorMsg = 'الفئة مطلوبة'; return; }

    const req = this.editingId
      ? this.productsSvc.update(this.editingId, this.form)
      : this.productsSvc.create(this.form);

    req.subscribe({
      next: () => {
        this.showForm = false;
        this.editingId = null;
        this.form = this.emptyForm();
        this.load();
        this.loadCategories();
        this.successMsg = 'تم الحفظ بنجاح';
        this.errorMsg = '';
      },
      error: () => (this.errorMsg = 'تعذر حفظ المنتج'),
    });
  }

  startEdit(p: Product) {
    this.editingId = p.id;
    this.form = {
      name: p.name, category: p.category, unit: p.unit,
      totalPrice: p.totalPrice, unitPrice: p.unitPrice, discountPercent: p.discountPercent,
      stockQuantity: p.stockQuantity, minStockAlert: p.minStockAlert,
    };
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingId = null;
    this.showForm = false;
    this.form = this.emptyForm();
  }

  openAdjust(p: Product) {
    this.adjustTarget = p;
    this.adjustDelta = 0;
  }

  confirmAdjust() {
    if (!this.adjustTarget || !this.adjustDelta) { this.adjustTarget = null; return; }
    this.productsSvc.adjustStock(this.adjustTarget.id, this.adjustDelta).subscribe({
      next: () => {
        this.successMsg = 'تم تعديل الكمية بنجاح';
        this.errorMsg = '';
        this.adjustTarget = null;
        this.load();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'تعذر تعديل الكمية';
        this.adjustTarget = null;
      },
    });
  }

  onFileSelected(event: Event, source: 'pdf' | 'excel') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.errorMsg = '';
    this.successMsg = '';
    this.importLoading = true;
    this.importSource = source;
    this.importRows = [];

    const request$ = source === 'excel' ? this.productsSvc.previewExcelImport(file) : this.productsSvc.previewPdfImport(file);

    request$.subscribe({
      next: (extracted: ExtractedRow[]) => {
        this.importLoading = false;
        if (!extracted.length) {
          this.errorMsg = 'ما انلقى أي صفوف فيها أرقام داخل الملف - جرب تتأكد إنو الملف فيه جدول أسعار واضح';
          return;
        }
        this.importRows = extracted.map((row) => {
          // ترتيب الأرقام مختلف حسب مصدر الملف:
          // - إكسل: الأعمدة عادة (الاسم، الكمية، الإفرادي، الاجمالي) → 3 أرقام بالترتيب [كمية، إفرادي، اجمالي]
          // - PDF: الاستخراج تخميني وغالبًا [اجمالي، إفرادي] بس - يضل المستخدم يراجعه يدويًا
          let totalPrice = row.numbers[0] ?? 0;
          let unitPrice = row.numbers[1] ?? 0;
          let stockQuantity = 0;

          if (source === 'excel' && row.numbers.length >= 3) {
            stockQuantity = row.numbers[0] ?? 0;
            unitPrice = row.numbers[1] ?? 0;
            totalPrice = row.numbers[2] ?? 0;
          }

          return {
            include: true,
            rawLine: row.rawLine,
            numbersHint: row.numbers.join('  -  '),
            name: row.guessedName,
            category: '',
            unit: 'قطعة',
            totalPrice,
            unitPrice,
            discountPercent: 0,
            stockQuantity,
            minStockAlert: 5,
          };
        });
      },
      error: (err) => {
        this.importLoading = false;
        this.errorMsg = err?.error?.message || 'تعذر تحليل الملف';
      },
    });

    input.value = ''; // يسمح تختار نفس الملف مرة تانية لو حبيت تعيد المحاولة
  }

  selectedCount(): number {
    return this.importRows.filter((r) => r.include).length;
  }

  cancelImport() {
    this.importRows = [];
  }

  confirmImport() {
    const selected = this.importRows.filter((r) => r.include);
    if (!selected.length) { this.errorMsg = 'اختر صف واحد على الأقل للاستيراد'; return; }

    const invalid = selected.find((r) => !r.name.trim() || !r.category.trim());
    if (invalid) { this.errorMsg = 'كل صف مختار لازم يكون فيه اسم مادة وفئة'; return; }

    this.importing = true;
    const rate = this.currencyRate(this.importCurrency); // كم ليرة سورية = وحدة واحدة من العملة المختارة
    const rows = selected.map((r) => ({
      name: r.name.trim(),
      category: r.category.trim(),
      unit: r.unit || 'قطعة',
      totalPrice: r.totalPrice * rate, // نحوّل دايمًا لليرة السورية لأنو أسعار المنتجات بالنظام محفوظة بالعملة الأساسية
      unitPrice: r.unitPrice * rate,
      discountPercent: r.discountPercent,
      stockQuantity: r.stockQuantity,
      minStockAlert: r.minStockAlert,
    }));

    this.productsSvc.confirmPdfImport(rows).subscribe({
      next: (res) => {
        this.importing = false;
        const parts: string[] = [];
        if (res.createdCount) parts.push(`${res.createdCount} صنف جديد`);
        if (res.restockedCount) parts.push(`${res.restockedCount} صنف تم تزويد مخزونه`);
        this.successMsg = 'تم بنجاح: ' + (parts.join(' و ') || 'لا شي');
        this.importRows = [];
        this.load();
        this.loadCategories();
      },
      error: (err) => {
        this.importing = false;
        this.errorMsg = err?.error?.message || 'تعذر حفظ المنتجات المستوردة';
      },
    });
  }
}