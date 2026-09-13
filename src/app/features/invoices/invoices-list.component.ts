import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { InvoicesService } from '../../core/services/invoices.service';

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <main class="main-area">
        <div class="topbar">
          <h2>الفواتير</h2>
          <a routerLink="/invoices/new" class="btn-copper">+ فاتورة جديدة</a>
        </div>

        <table class="data-table">
          <thead>
            <tr><th>رقم الفاتورة</th><th>النوع</th><th>الموظف</th><th>الإجمالي</th><th>التاريخ</th><th></th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let inv of invoices">
              <td class="num">{{ inv.invoiceNumber }}</td>
              <td>{{ inv.type === 'MERCHANT' ? 'تاجر' : 'عادي' }}</td>
              <td class="name">{{ inv.employee?.name }}</td>
              <td class="num">{{ inv.total | number:'1.0-2' }}</td>
              <td class="num">{{ inv.createdAt | date: 'yyyy/MM/dd' }}</td>
              <td>
                <button class="link-btn" (click)="invoicesSvc.downloadExcel(inv.id, inv.invoiceNumber)">Excel</button> ·
                <button class="link-btn" (click)="invoicesSvc.downloadPdf(inv.id, inv.invoiceNumber)">PDF</button>
              </td>
            </tr>
            <tr *ngIf="!invoices.length">
              <td colspan="6" class="no-results">ما فيه فواتير بعد</td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>
  `,
  styles: [`
    .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;}
    .topbar h2{font-size:22px;}
    .link-btn{background:none;border:none;color:var(--line-cyan);text-decoration:underline;font-size:12px;cursor:pointer;font-family:inherit;padding:0;}
    .no-results{text-align:center;color:var(--text-dim);padding:20px;}
  `],
})
export class InvoicesListComponent implements OnInit {
  invoices: any[] = [];
  constructor(public invoicesSvc: InvoicesService) {}
  ngOnInit() {
    this.invoicesSvc.findAll().subscribe({ next: (data) => (this.invoices = data) });
  }
}
