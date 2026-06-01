import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav mode="side" opened="true" class="sidenav">
        <div class="sidenav-header">
          <h2>事故管理系统</h2>
        </div>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon>
            <span>仪表盘</span>
          </a>
          <a mat-list-item routerLink="/accidents" routerLinkActive="active">
            <mat-icon>report</mat-icon>
            <span>事故管理</span>
          </a>
          <a mat-list-item routerLink="/vehicles/board" routerLinkActive="active">
            <mat-icon>directions_car</mat-icon>
            <span>车辆看板</span>
          </a>
          <a mat-list-item *ngIf="isRepairManager || isDispatcher" routerLink="/repairs" routerLinkActive="active">
            <mat-icon>build</mat-icon>
            <span>维修管理</span>
          </a>
          <a mat-list-item *ngIf="isInsuranceSpecialist || isDispatcher" routerLink="/claims" routerLinkActive="active">
            <mat-icon>receipt</mat-icon>
            <span>理赔管理</span>
          </a>
          <a mat-list-item routerLink="/exceptions" routerLinkActive="active">
            <mat-icon>warning</mat-icon>
            <span>异常反馈</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary" class="toolbar">
          <span class="toolbar-spacer"></span>
          <div class="user-info">
            <button mat-button [matMenuTriggerFor]="userMenu">
              <mat-icon>account_circle</mat-icon>
              <span>{{ currentUser?.name }}</span>
              <mat-icon>arrow_drop_down</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
              <div mat-menu-item disabled class="user-role">
                角色: {{ roleLabel }}
              </div>
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon>
                <span>退出登录</span>
              </button>
            </mat-menu>
          </div>
        </mat-toolbar>
        <div class="content">
          <ng-content></ng-content>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }
    .sidenav {
      width: 240px;
      background: #f5f5f5;
    }
    .sidenav-header {
      padding: 16px;
      background: #3f51b5;
      color: white;
    }
    .sidenav-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }
    .mat-nav-list a {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .mat-nav-list a.active {
      background: rgba(63, 81, 181, 0.1);
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
    }
    .toolbar-spacer {
      flex: 1;
    }
    .user-info {
      display: flex;
      align-items: center;
    }
    .user-role {
      font-size: 12px;
      color: #666;
      padding: 8px 16px;
    }
    .content {
      padding: 24px;
      min-height: calc(100vh - 64px);
      background: #fafafa;
    }
  `]
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser: User | null = null;
  isRepairManager = false;
  isInsuranceSpecialist = false;
  isDispatcher = false;

  get roleLabel(): string {
    const roleMap: Record<string, string> = {
      driver: '司机',
      dispatcher: '调度员',
      repair_manager: '维修主管',
      insurance_specialist: '保险专员',
    };
    return roleMap[this.currentUser?.role || ''] || '';
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isRepairManager = user?.role === 'repair_manager';
      this.isInsuranceSpecialist = user?.role === 'insurance_specialist';
      this.isDispatcher = user?.role === 'dispatcher';
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
