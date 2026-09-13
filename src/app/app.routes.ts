import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'products',
    canActivate: [authGuard],
    loadComponent: () => import('./features/products/products.component').then((m) => m.ProductsComponent),
  },
  {
    path: 'inventory',
    canActivate: [authGuard],
    loadComponent: () => import('./features/inventory/inventory.component').then((m) => m.InventoryComponent),
  },
  {
    path: 'invoices',
    canActivate: [authGuard],
    loadComponent: () => import('./features/invoices/invoices-list.component').then((m) => m.InvoicesListComponent),
  },
  {
    path: 'invoices/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/invoices/invoice-create.component').then((m) => m.InvoiceCreateComponent),
  },
  {
    path: 'sales',
    canActivate: [authGuard],
    loadComponent: () => import('./features/sales/sales.component').then((m) => m.SalesComponent),
  },
  {
    path: 'employees',
    canActivate: [authGuard],
    loadComponent: () => import('./features/employees/employees.component').then((m) => m.EmployeesComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'activity-log',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/activity-log/activity-log.component').then((m) => m.ActivityLogComponent),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
