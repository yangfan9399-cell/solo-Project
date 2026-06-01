import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LayoutComponent } from '../../shared/components/layout.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { VehicleService } from '../../core/services/vehicle.service';
import { Vehicle } from '../../shared/models/accident.model';

@Component({
  selector: 'app-vehicle-board',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    LayoutComponent,
    LoadingComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <app-layout>
      <div class="vehicle-board">
        <div class="page-header">
          <h1>车辆停运看板</h1>
        </div>

        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-label">停运总数</span>
            <span class="stat-value total">{{ data?.stats?.total || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">待维修</span>
            <span class="stat-value out">{{ data?.stats?.outOfService || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">维修中</span>
            <span class="stat-value repair">{{ data?.stats?.inRepair || 0 }}</span>
          </div>
        </div>

        <ng-container *ngIf="!loading; else loadingTemplate">
          <ng-container *ngIf="!error; else errorTemplate">
            <ng-container *ngIf="data?.vehicles?.length; else emptyTemplate">
              <div class="vehicle-grid">
                <mat-card *ngFor="let vehicle of data.vehicles" class="vehicle-card" [class]="vehicle.status">
                  <mat-card-header>
                    <div class="vehicle-status">
                      <span class="status-dot"></span>
                      <span>{{ getVehicleStatusLabel(vehicle.status) }}</span>
                    </div>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="plate-number">{{ vehicle.plateNumber }}</div>
                    <div class="vehicle-model">{{ vehicle.model }}</div>
                    <div class="vehicle-type" *ngIf="vehicle.type">{{ vehicle.type }}</div>
                  </mat-card-content>
                  <mat-card-footer>
                    <span class="update-time">更新于 {{ formatDate(vehicle.updatedAt) }}</span>
                  </mat-card-footer>
                </mat-card>
              </div>
            </ng-container>
            <ng-template #emptyTemplate>
              <app-empty-state
                icon="directions_car"
                title="暂无停运车辆"
                description="所有车辆都在正常运营中"
              ></app-empty-state>
            </ng-template>
          </ng-container>
          <ng-template #errorTemplate>
            <app-error-state (retry)="loadData()"></app-error-state>
          </ng-template>
        </ng-container>
        <ng-template #loadingTemplate>
          <app-loading message="加载中..."></app-loading>
        </ng-template>
      </div>
    </app-layout>
  `,
  styles: [`
    .page-header h1 {
      margin: 0 0 16px 0;
      font-size: 24px;
      font-weight: 500;
    }
    .stats-bar {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
      padding: 16px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 600;
    }
    .stat-value.total { color: #3f51b5; }
    .stat-value.out { color: #f44336; }
    .stat-value.repair { color: #ff9800; }
    .vehicle-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .vehicle-card.out_of_service {
      border-left: 4px solid #f44336;
    }
    .vehicle-card.in_repair {
      border-left: 4px solid #ff9800;
    }
    .vehicle-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #666;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .out_of_service .status-dot { background: #f44336; }
    .in_repair .status-dot { background: #ff9800; }
    .plate-number {
      font-size: 20px;
      font-weight: 600;
      margin: 8px 0;
    }
    .vehicle-model {
      font-size: 14px;
      color: #666;
    }
    .vehicle-type {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
    .update-time {
      font-size: 11px;
      color: #999;
      padding: 8px 16px;
    }
  `]
})
export class VehicleBoardComponent implements OnInit {
  private vehicleService = inject(VehicleService);

  data: any = null;
  loading = true;
  error = false;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = false;

    this.vehicleService.findOutOfService().subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  getVehicleStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      out_of_service: '待维修',
      in_repair: '维修中',
    };
    return labels[status] || status;
  }

  formatDate(date: any): string {
    return new Date(date).toLocaleString('zh-CN');
  }
}
