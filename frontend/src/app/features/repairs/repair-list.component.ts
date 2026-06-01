import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { LayoutComponent } from '../../shared/components/layout.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { RepairService } from '../../core/services/repair.service';
import { AuthService } from '../../core/services/auth.service';
import { Repair, RepairStatus } from '../../shared/models/repair.model';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Component({
  selector: 'app-repair-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    LayoutComponent,
    LoadingComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <app-layout>
      <div class="repair-list">
        <div class="page-header">
          <h1>维修管理</h1>
        </div>

        <mat-card class="filter-card">
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>状态筛选</mat-label>
              <mat-select [formControl]="statusControl">
                <mat-option value="">全部状态</mat-option>
                <mat-option value="pending">待开始</mat-option>
                <mat-option value="in_progress">维修中</mat-option>
                <mat-option value="completed">已完成</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card>

        <ng-container *ngIf="!loading; else loadingTemplate">
          <ng-container *ngIf="!error; else errorTemplate">
            <mat-card>
              <ng-container *ngIf="data?.data?.length; else emptyTemplate">
                <table mat-table [dataSource]="data.data">
                  <ng-container matColumnDef="accidentId">
                    <th mat-header-cell *matHeaderCellDef>关联事故</th>
                    <td mat-cell *matCellDef="let row">{{ row.accidentId?.substring(0, 8) }}...</td>
                  </ng-container>
                  <ng-container matColumnDef="repairManager">
                    <th mat-header-cell *matHeaderCellDef>维修主管</th>
                    <td mat-cell *matCellDef="let row">{{ row.repairManager?.name || '-' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="estimatedCost">
                    <th mat-header-cell *matHeaderCellDef>预估费用</th>
                    <td mat-cell *matCellDef="let row">¥{{ row.estimatedCost?.toFixed(2) || '-' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actualCost">
                    <th mat-header-cell *matHeaderCellDef>实际费用</th>
                    <td mat-cell *matCellDef="let row">¥{{ row.actualCost?.toFixed(2) || '-' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="startTime">
                    <th mat-header-cell *matHeaderCellDef>开始时间</th>
                    <td mat-cell *matCellDef="let row">{{ row.startTime ? formatDate(row.startTime) : '-' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="estimatedEndTime">
                    <th mat-header-cell *matHeaderCellDef>预计完成</th>
                    <td mat-cell *matCellDef="let row">{{ row.estimatedEndTime ? formatDate(row.estimatedEndTime) : '-' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>状态</th>
                    <td mat-cell *matCellDef="let row">
                      <span class="status-badge" [class]="row.status">{{ getStatusLabel(row.status) }}</span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="items">
                    <th mat-header-cell *matHeaderCellDef>维修项</th>
                    <td mat-cell *matCellDef="let row">{{ row.items?.length || 0 }}项</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
                <mat-paginator
                  [length]="data.total"
                  [pageSize]="pageSize"
                  [pageIndex]="pageIndex - 1"
                  (page)="onPageChange($event)">
                </mat-paginator>
              </ng-container>
              <ng-template #emptyTemplate>
                <app-empty-state
                  icon="build"
                  title="暂无维修记录"
                  description="系统中还没有维修记录，事故审核通过后会自动创建维修任务"
                ></app-empty-state>
              </ng-template>
            </mat-card>
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
    .filter-card {
      margin-bottom: 16px;
    }
    .filters {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-badge.pending { background: #fff3e0; color: #e65100; }
    .status-badge.in_progress { background: #ffebee; color: #c62828; }
    .status-badge.completed { background: #e8f5e9; color: #2e7d32; }
    mat-table {
      width: 100%;
    }
  `]
})
export class RepairListComponent implements OnInit {
  private repairService = inject(RepairService);
  private authService = inject(AuthService);

  loading = true;
  error = false;
  data: PaginatedResult<Repair> = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  displayedColumns = ['accidentId', 'repairManager', 'estimatedCost', 'actualCost', 'startTime', 'estimatedEndTime', 'items', 'status'];
  statusControl = new FormControl('');
  pageIndex = 1;
  pageSize = 10;

  ngOnInit() {
    this.loadData();

    this.statusControl.valueChanges.subscribe(() => {
      this.pageIndex = 1;
      this.loadData();
    });
  }

  loadData() {
    this.loading = true;
    this.error = false;

    this.repairService.findAll(
      this.pageIndex,
      this.pageSize,
      this.statusControl.value || undefined
    ).subscribe({
      next: (result) => {
        this.data = result;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  formatDate(date: any): string {
    return new Date(date).toLocaleString('zh-CN');
  }

  getStatusLabel(status: RepairStatus): string {
    const labels: Record<RepairStatus, string> = {
      pending: '待开始',
      in_progress: '维修中',
      completed: '已完成',
    };
    return labels[status];
  }
}
