import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { EmployeesService, Employee, PermissionCatalogItem } from '../../core/services/employees.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <main class="main-area">
        <div class="topbar">
          <h2>الموظفون</h2>
          <button class="btn-copper" (click)="showForm = !showForm">{{ showForm ? 'إغلاق' : '+ إضافة موظف' }}</button>
        </div>

        <div class="panel" *ngIf="showForm">
          <h3>موظف جديد</h3>
          <div class="grid2">
            <div class="field"><label>الاسم</label><input [(ngModel)]="form.name" /></div>
            <div class="field"><label>البريد الإلكتروني</label><input [(ngModel)]="form.email" /></div>
            <div class="field"><label>الهاتف</label><input [(ngModel)]="form.phone" /></div>
            <div class="field"><label>كلمة المرور</label><input type="password" [(ngModel)]="form.password" /></div>
            <div class="field"><label>الصلاحية</label>
              <select [(ngModel)]="form.role">
                <option value="EMPLOYEE">موظف</option>
                <option value="MANAGER">مشرف</option>
                <option value="ADMIN">مدير</option>
              </select>
            </div>
          </div>
          <button class="btn-copper" (click)="save()">حفظ الموظف</button>
        </div>

        <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
        <div class="success-msg" *ngIf="successMsg">{{ successMsg }}</div>

        <table class="data-table">
          <thead><tr><th>الاسم</th><th>البريد</th><th>الصلاحية</th><th>أداء</th><th>اذونات الوصول</th></tr></thead>
          <tbody>
            <tr *ngFor="let e of employees">
              <td class="name">{{ e.name }}</td>
              <td class="num">{{ e.email }}</td>
              <td>{{ roleLabel(e.role) }}</td>
              <td><button class="link-btn" (click)="loadPerf(e)">عرض</button></td>
              <td>
                <button class="link-btn" *ngIf="e.role === 'EMPLOYEE'" (click)="openPermissions(e)">تعديل الاذونات</button>
                <span class="muted" *ngIf="e.role !== 'EMPLOYEE'">كل الصلاحيات (بحكم الدور)</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="panel" *ngIf="perf">
          <h3>أداء {{ perf.employeeId === selectedId ? selectedName : '' }}</h3>
          <div class="perf-row"><span>عدد الفواتير</span><span class="num">{{ perf.totalInvoices }}</span></div>
          <div class="perf-row"><span>إجمالي القطع المباعة</span><span class="num">{{ perf.totalPiecesSold }}</span></div>
          <div class="perf-row"><span>إجمالي قيمة المبيعات</span><span class="num">{{ perf.totalSalesValue }}</span></div>
        </div>

        <!-- المكان الخاص بالمدير: تفعيل/تعطيل صلاحيات محددة لكل موظف -->
        <div class="modal-backdrop" *ngIf="permissionsTarget" (click)="permissionsTarget = null">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>اذونات {{ permissionsTarget.name }}</h3>
            <p class="hint-text">فعّل أو عطّل أي وحدة صلاحية لهاد الموظف تحديدًا.</p>
            <div class="perm-list">
              <label class="perm-item" *ngFor="let item of permissionCatalog">
                <input type="checkbox" [(ngModel)]="permissionsMap[item.key]" />
                <span>{{ item.label }}</span>
              </label>
            </div>
            <div class="form-actions">
              <button class="btn-copper" (click)="savePermissions()">حفظ الاذونات</button>
              <button class="btn-ghost" (click)="permissionsTarget = null">إلغاء</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;}
    .topbar h2{font-size:22px;}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    .link-btn{background:none;border:none;color:var(--line-cyan);font-size:12px;text-decoration:underline;cursor:pointer;}
    .muted{color:var(--text-dim);font-size:11.5px;}
    .perf-row{display:flex;justify-content:space-between;padding:8px 0;font-size:13.5px;border-bottom:1px solid rgba(14,138,160,0.15);}
    .success-msg{background:rgba(76,154,106,0.15);border:1px solid rgba(76,154,106,0.4);color:#a8e0b8;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:14px;}

    .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:100;}
    .modal{background:var(--bg-surface);border:1px solid rgba(14,138,160,0.4);border-radius:12px;padding:22px;width:420px;max-width:90vw;}
    .modal h3{margin-bottom:6px;}
    .hint-text{color:var(--text-dim);font-size:12px;margin-bottom:14px;}
    .perm-list{display:flex;flex-direction:column;gap:10px;margin-bottom:16px;max-height:320px;overflow-y:auto;}
    .perm-item{display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;}
    .form-actions{display:flex;gap:10px;}
  `],
})
export class EmployeesComponent implements OnInit {
  employees: Employee[] = [];
  showForm = false;
  errorMsg = '';
  successMsg = '';
  perf: any = null;
  selectedId = '';
  selectedName = '';
  form: any = { name: '', email: '', phone: '', password: '', role: 'EMPLOYEE' };

  permissionCatalog: PermissionCatalogItem[] = [];
  permissionsTarget: Employee | null = null;
  permissionsMap: Record<string, boolean> = {};

  constructor(private employeesSvc: EmployeesService) {}

  ngOnInit() {
    this.load();
    this.employeesSvc.permissionsCatalog().subscribe({ next: (data) => (this.permissionCatalog = data) });
  }

  load() {
    this.employeesSvc.findAll().subscribe({
      next: (data) => (this.employees = data),
      error: () => (this.errorMsg = 'تعذر تحميل الموظفين (لازم صلاحية مدير/مشرف)'),
    });
  }

  roleLabel(role: string) {
    return role === 'ADMIN' ? 'مدير' : role === 'MANAGER' ? 'مشرف' : 'موظف';
  }

  save() {
    if (!this.form.name || !this.form.email || !this.form.password) {
      this.errorMsg = 'الاسم والبريد وكلمة المرور مطلوبين';
      return;
    }
    this.employeesSvc.create(this.form).subscribe({
      next: () => {
        this.showForm = false;
        this.form = { name: '', email: '', phone: '', password: '', role: 'EMPLOYEE' };
        this.load();
      },
      error: (err) => (this.errorMsg = err?.error?.message || 'تعذر حفظ الموظف'),
    });
  }

  loadPerf(e: Employee) {
    this.selectedId = e.id;
    this.selectedName = e.name;
    this.employeesSvc.performance(e.id).subscribe({ next: (data) => (this.perf = data) });
  }

  openPermissions(e: Employee) {
    this.permissionsTarget = e;
    this.employeesSvc.getPermissions(e.id).subscribe({
      next: (data) => (this.permissionsMap = { ...data.permissions }),
      error: () => (this.errorMsg = 'تعذر تحميل اذونات هاد الموظف'),
    });
  }

  savePermissions() {
    if (!this.permissionsTarget) return;
    this.employeesSvc.setPermissions(this.permissionsTarget.id, this.permissionsMap).subscribe({
      next: () => {
        this.successMsg = `تم تحديث اذونات ${this.permissionsTarget?.name}`;
        this.errorMsg = '';
        this.permissionsTarget = null;
      },
      error: (err) => (this.errorMsg = err?.error?.message || 'تعذر حفظ الاذونات'),
    });
  }
}
