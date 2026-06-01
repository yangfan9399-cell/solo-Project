import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'accidents',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/accidents/accident-list.component').then(m => m.AccidentListComponent),
          },
          {
            path: 'new',
            loadComponent: () => import('./features/accidents/accident-form.component').then(m => m.AccidentFormComponent),
            data: { roles: ['driver', 'dispatcher'] },
          },
          {
            path: ':id',
            loadComponent: () => import('./features/accidents/accident-detail.component').then(m => m.AccidentDetailComponent),
          },
        ],
      },
      {
        path: 'vehicles',
        children: [
          {
            path: 'board',
            loadComponent: () => import('./features/vehicles/vehicle-board.component').then(m => m.VehicleBoardComponent),
          },
        ],
      },
      {
        path: 'repairs',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/repairs/repair-list.component').then(m => m.RepairListComponent),
            data: { roles: ['repair_manager', 'dispatcher'] },
          },
          {
            path: 'new',
            loadComponent: () => import('./features/repairs/repair-detail.component').then(m => m.RepairDetailComponent),
            data: { roles: ['repair_manager'] },
          },
          {
            path: ':id',
            loadComponent: () => import('./features/repairs/repair-detail.component').then(m => m.RepairDetailComponent),
            data: { roles: ['repair_manager'] },
          },
        ],
      },
      {
        path: 'claims',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/claims/claim-list.component').then(m => m.ClaimListComponent),
            data: { roles: ['insurance_specialist', 'dispatcher'] },
          },
          {
            path: 'new',
            loadComponent: () => import('./features/claims/claim-detail.component').then(m => m.ClaimDetailComponent),
            data: { roles: ['insurance_specialist'] },
          },
          {
            path: ':id',
            loadComponent: () => import('./features/claims/claim-detail.component').then(m => m.ClaimDetailComponent),
            data: { roles: ['insurance_specialist'] },
          },
        ],
      },
      {
        path: 'exceptions',
        loadComponent: () => import('./features/exceptions/exception-list.component').then(m => m.ExceptionListComponent),
      },
    ],
  },
];
