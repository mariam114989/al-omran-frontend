import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { ActivityLogService } from '../../core/services/activity-log.service';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <main class="main-area">
        <div class="topbar"><h2>سجل النشاط</h2></div>
        <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
        <div class="timeline">
          <div class="event" *ngFor="let log of logs">
            <div class="event-icon">{{ iconFor(log.action) }}</div>
            <div class="event-body">
              <div class="msg">{{ log.message }}</div>
              <div class="meta">
                <span *ngIf="log.user">{{ log.user.name }}</span>
                <span>{{ log.createdAt | date: 'yyyy/MM/dd HH:mm' }}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .topbar{margin-bottom:24px;} .topbar h2{font-size:22px;}
    .timeline{position:relative;}
    .event{display:flex;gap:16px;margin-bottom:4px;padding:14px 0;}
    .event-icon{width:44px;height:44px;border-radius:50%;background:var(--bg-surface);border:1px solid rgba(14,138,160,0.4);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:17px;}
    .event-body{flex:1;background:var(--bg-surface);border:1px solid rgba(14,138,160,0.25);border-radius:10px;padding:12px 16px;}
    .msg{font-size:13.5px;margin-bottom:5px;}
    .meta{font-size:11px;color:var(--text-dim);display:flex;gap:12px;}
  `],
})
export class ActivityLogComponent implements OnInit {
  logs: any[] = [];
  errorMsg = '';
  constructor(private svc: ActivityLogService) {}
  ngOnInit() {
    this.svc.findRecent(50).subscribe({
      next: (data) => (this.logs = data),
      error: () => (this.errorMsg = 'تعذر تحميل سجل النشاط (لازم صلاحية مدير/مشرف)'),
    });
  }
  iconFor(action: string): string {
    const map: Record<string, string> = {
      INVOICE_CREATED: '🧾', STOCK_LOW_ALERT: '⚠️', PRODUCT_CREATED: '📦',
      PRODUCT_UPDATED: '📦', EMPLOYEE_CREATED: '👤', LOGIN: '🔐',
    };
    return map[action] || '🔔';
  }
}
