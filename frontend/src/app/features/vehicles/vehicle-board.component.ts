import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LayoutComponent } from '../../shared/components/layout.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { VehicleService } from '../../core/services/vehicle.service';
import { Vehicle } from '../../shared/models/accident.model';

interface VehicleWithAccident extends Vehicle {
  currentAccident?: {
    id: string;
    reportNo: string;
    reporter?: { name: string };
    status: string;
    location?: string;
  };
}

@Component({
  selector: 'app-vehicle-board',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
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
          <button mat-stroked-button (click)="loadData()">
            <mat-icon>refresh</mat-icon>
            刷新
          </button>
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
                <mat-card
                  *ngFor="let vehicle of data.vehicles"
                  class="vehicle-card"
                  [class]="vehicle.status"
                  (click)="goToAccident(vehicle)"
                  [matTooltip]="vehicle.currentAccident ? '点击查看事故详情' : ''"
                >
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

                    <div class="accident-info" *ngIf="vehicle.currentAccident">
                      <div class="info-row">
                        <mat-icon inline>report</mat-icon>
                        <span>{{ vehicle.currentAccident.reportNo }}</span>
                      </div>
                      <div class="info-row" *ngIf="vehicle.currentAccident.location">
                        <mat-icon inline>location_on</mat-icon>
                        <span>{{ vehicle.currentAccident.location }}</span>
                      </div>
                    </div>

                    <div class="dispatch-info" *ngIf="vehicle.outOfServiceReason">
                      <div class="info-section">
                        <label>停运原因</label>
                        <p>{{ vehicle.outOfServiceReason }}</p>
                      </div>
                      <div class="info-row" *ngIf="vehicle.expectedResumeTime">
                        <mat-icon inline>event</mat-icon>
                        <span>预计复运: {{ formatDate(vehicle.expectedResumeTime) }}</span>
                      </div>
                      <div class="info-row" *ngIf="vehicle.dispatcher">
                        <mat-icon inline>person</mat-icon>
                        <span>调度员: {{ vehicle.dispatcher.name }}</span>
                      </div>
                    </div>

                    <div class="no-dispatch-info" *ngIf="!vehicle.outOfServiceReason && vehicle.currentAccident">
                      <span class="warning">等待调度员安排停运</span>
                    </div>
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
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .page-header h1 {
      margin: 0;
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
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .vehicle-card {
      cursor: pointer;
      transition: box-shadow 0.2s;
    }
    .vehicle-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
      margin: 8px 0 4px 0;
    }
    .vehicle-model {
      font-size: 14px;
      color: #666;
    }
    .vehicle-type {
      font-size: 12px;
      color: #999;
      margin-bottom: 8px;
    }
    .accident-info {
      margin-top: 12px;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .info-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #555;
      margin: 4px 0;
    }
    .info-row mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .dispatch-info {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #eee;
    }
    .info-section {
      margin-bottom: 8px;
    }
    .info-section label {
      display: block;
      font-size: 11px;
      color: #999;
      margin-bottom: 2px;
    }
    .info-section p {
      margin: 0;
      font-size: 13px;
      color: #333;
    }
    .no-dispatch-info {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #eee;
    }
    .warning {
      font-size: 12px;
      color: #f44336;
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
  private router = inject(Router);

  data: {
    vehicles: VehicleWithAccident[];
    stats: { total: number; outOfService: number; inRepair: number };
  } | null = null;
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

  goToAccident(vehicle: VehicleWithAccident) {
    if (vehicle.currentAccident) {
      this.router.navigate(['/accidents', vehicle.currentAccident.id]);
    }
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
