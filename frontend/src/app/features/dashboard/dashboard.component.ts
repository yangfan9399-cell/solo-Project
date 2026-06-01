import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { LayoutComponent } from '../../shared/components/layout.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { AccidentService } from '../../core/services/accident.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    LayoutComponent,
    LoadingComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <app-layout>
      <div class="dashboard">
        <div class="dashboard-header">
          <h1>仪表盘</h1>
          <button mat-raised-button color="primary" *ngIf="canCreateAccident" (click)="goToCreate()">
            <mat-icon>add</mat-icon>
            报备事故
          </button>
        </div>

        <ng-container *ngIf="!loading; else loadingTemplate">
          <ng-container *ngIf="!error; else errorTemplate">
            <div class="stats-grid">
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-icon total">
                    <mat-icon>description</mat-icon>
                  </div>
                  <div class="stat-content">
                    <h3>{{ stats?.total || 0 }}</h3>
                    <p>事故总数</p>
                  </div>
                </mat-card-content>
              </mat-card>
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-icon pending">
                    <mat-icon>schedule</mat-icon>
                  </div>
                  <div class="stat-content">
                    <h3>{{ stats?.byStatus?.pending_review || 0 }}</h3>
                    <p>待审核</p>
                  </div>
                </mat-card-content>
              </mat-card>
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-icon repair">
                    <mat-icon>build</mat-icon>
                  </div>
                  <div class="stat-content">
                    <h3>{{ stats?.byStatus?.in_repair || 0 }}</h3>
                    <p>维修中</p>
                  </div>
                </mat-card-content>
              </mat-card>
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-icon completed">
                    <mat-icon>check_circle</mat-icon>
                  </div>
                  <div class="stat-content">
                    <h3>{{ outOfServiceStats?.stats?.total || 0 }}</h3>
                    <p>停运车辆</p>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <div class="content-grid">
              <mat-card class="list-card">
                <mat-card-header>
                  <mat-card-title>最近事故</mat-card-title>
                  <button mat-button color="primary" (click)="goToAccidents()">查看全部</button>
                </mat-card-header>
                <mat-card-content>
                  <ng-container *ngIf="recentAccidents?.length; else noAccidents">
                    <div class="accident-item" *ngFor="let accident of recentAccidents">
                      <div class="accident-info">
                        <span class="plate-number">{{ accident.vehicle?.plateNumber }}</span>
                        <span class="accident-location">{{ accident.location }}</span>
                      </div>
                      <span class="status-badge" [class]="accident.status]">{{ getStatusLabel(accident.status) }}</span>
                    </div>
                  </ng-container>
                  <ng-template #noAccidents>
                    <app-empty-state
                      icon="inbox"
                      title="暂无事故记录"
                      description="系统中还没有事故记录"
                      style="padding: 20px 0;">
                    </app-empty-state>
                  </ng-template>
                </mat-card-content>
              </mat-card>

              <mat-card class="list-card">
                <mat-card-header>
                  <mat-card-title>停运车辆</mat-card-title>
                  <button mat-button color="primary" (click)="goToVehicles()">查看全部</button>
                </mat-card-header>
                <mat-card-content>
                  <ng-container *ngIf="outOfServiceVehicles?.length; else noVehicles">
                    <div class="vehicle-item" *ngFor="let vehicle of outOfServiceVehicles">
                      <div class="vehicle-info">
                        <span class="plate-number">{{ vehicle.plateNumber }}</span>
                        <span class="vehicle-model">{{ vehicle.model }}</span>
                      </div>
                      <span class="status-badge" [class]="vehicle.status]">{{ getVehicleStatusLabel(vehicle.status) }}</span>
                    </div>
                  </ng-container>
                  <ng-template #noVehicles>
                    <app-empty-state
                      icon="directions_car"
                      title="暂无停运车辆"
                      description="所有车辆正常运行中"
                      style="padding: 20px 0;">
                    </app-empty-state>
                  </ng-template>
                </mat-card-content>
              </mat-card>
            </div>
          </ng-container>
          <ng-template #errorTemplate">
            <app-error-state (retry)="loadData()"></app-error-state>
          </ng-template>
        </ng-container>
        <ng-template #loadingTemplate>
          <app-loading message="数据加载中..." fullScreen></app-loading>
        </ng-template>
      </div>
    </app-layout>
  `,
  styles: [`
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .dashboard-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      display: flex;
      align-items: center;
    }
    .stat-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
    }
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .stat-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    .stat-icon.total { background: #3f51b5; }
    .stat-icon.pending { background: #ff9800; }
    .stat-icon.repair { background: #f44336; }
    .stat-icon.completed { background: #4caf50; }
    .stat-content h3 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .stat-content p {
      margin: 4px 0 0 0;
      font-size: 14px;
      color: #666;
    }
    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }
    .list-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
    }
    .list-card mat-card-title {
      margin: 0;
      font-size: 16px;
    }
    .accident-item, .vehicle-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .accident-item:last-child, .vehicle-item:last-child {
      border-bottom: none;
    }
    .accident-info, .vehicle-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .plate-number {
      font-weight: 500;
      font-size: 14px;
    }
    .accident-location, .vehicle-model {
      font-size: 12px;
      color: #666;
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-badge.pending_review { background: #fff3e0; color: #e65100; }
    .status-badge.reviewed { background: #e3f2fd; color: #1565c0; }
    .status-badge.in_repair { background: #ffebee; color: #c62828; }
    .status-badge.in_claim { background: #f3e5f5; color: #7b1fa2; }
    .status-badge.completed { background: #e8f5e9; color: #2e7d32; }
    .status-badge.rejected { background: #ffebee; color: #c62828; }
    .status-badge.out_of_service { background: #ffebee; color: #c62828; }
    .status-badge.in_repair { background: #fff3e0; color: #e65100; }
  `]
})
export class DashboardComponent implements OnInit {
  private accidentService = inject(AccidentService);
  private vehicleService = inject(VehicleService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = true;
  error = false;
  stats: any = null;
  recentAccidents: any[] = [];
  outOfServiceStats: any = null;
  outOfServiceVehicles: any[] = [];

  get canCreateAccident(): boolean {
    return this.authService.hasRole(['driver', 'dispatcher']);
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = false;

    this.accidentService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: () => {
        this.error = true;
      },
    });

    this.accidentService.findAll(1, 5).subscribe({
      next: (result) => {
        this.recentAccidents = result.data;
      },
      error: () => {
        this.error = true;
      },
    });

    this.vehicleService.findOutOfService().subscribe({
      next: (data) => {
        this.outOfServiceStats = data;
        this.outOfServiceVehicles = data.vehicles.slice(0, 5);
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending_review: '待审核',
      reviewed: '已审核',
      in_repair: '维修中',
      in_claim: '理赔中',
      completed: '已完成',
      rejected: '已驳回',
    };
    return labels[status] || status;
  }

  getVehicleStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: '正常',
      out_of_service: '停运',
      in_repair: '维修中',
    };
    return labels[status] || status;
  }

  goToCreate() {
    this.router.navigate(['/accidents/new']);
  }

  goToAccidents() {
    this.router.navigate(['/accidents']);
  }

  goToVehicles() {
    this.router.navigate(['/vehicles/board']);
  }
}
