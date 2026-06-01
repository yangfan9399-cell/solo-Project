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
import { ClaimService } from '../../core/services/claim.service';
import { AuthService } from '../../core/services/auth.service';
import { Claim, ClaimStatus } from '../../shared/models/claim.model';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Component({
  selector: 'app-claim-list',
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
      <div class="claim-list">
        <div class="page-header">
          <h1>理赔管理</h1>
        </div>

        <mat-card class="filter-card">
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>状态筛选</mat-label>
              <mat-select [formControl]="statusControl">
                <mat-option value="">全部状态</mat-option>
                <mat-option value="pending_materials">待补充材料</mat-option>
                <mat-option value="under_review">审核中</mat-option>
                <mat-option value="approved">已通过</mat-option>
                <mat-option value="paid">已赔付</mat-option>
                <mat-option value="rejected">已驳回</mat-option>
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
                  <ng-container matColumnDef="insuranceSpecialist">
                    <th mat-header-cell *matHeaderCellDef>保险专员</th>
                    <td mat-cell *matCellDef="let row">{{ row.insuranceSpecialist?.name || '-' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="policyNo">
                    <th mat-header-cell *matHeaderCellDef>保单号</th>
                    <td mat-cell *matCellDef="let row">{{ row.policyNo || '-' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="claimAmount">
                    <th mat-header-cell *matHeaderCellDef>理赔金额</th>
                    <td mat-cell *matCellDef="let row">¥{{ row.claimAmount?.toFixed(2) || '-' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="paidAmount">
                    <th mat-header-cell *matHeaderCellDef>已赔付</th>
                    <td mat-cell *matCellDef="let row">¥{{ row.paidAmount?.toFixed(2) || '-' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="createdAt">
                    <th mat-header-cell *matHeaderCellDef>创建时间</th>
                    <td mat-cell *matCellDef="let row">{{ formatDate(row.createdAt) }}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>状态</th>
                    <td mat-cell *matCellDef="let row">
                      <span class="status-badge" [class]="row.status">{{ getStatusLabel(row.status) }}</span>
                    </td>
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
                  icon="receipt"
                  title="暂无理赔记录"
                  description="系统中还没有理赔记录，维修完成后会自动创建理赔任务"
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
    .status-badge.pending_materials { background: #fff3e0; color: #e65100; }
    .status-badge.under_review { background: #e3f2fd; color: #1565c0; }
    .status-badge.approved { background: #e8f5e9; color: #2e7d32; }
    .status-badge.paid { background: #e8f5e9; color: #2e7d32; }
    .status-badge.rejected { background: #ffebee; color: #c62828; }
    mat-table {
      width: 100%;
    }
  `]
})
export class ClaimListComponent implements OnInit {
  private claimService = inject(ClaimService);
  private authService = inject(AuthService);

  loading = true;
  error = false;
  data: PaginatedResult<Claim> = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  displayedColumns = ['accidentId', 'insuranceSpecialist', 'policyNo', 'claimAmount', 'paidAmount', 'createdAt', 'status'];
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

    this.claimService.findAll(
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

  getStatusLabel(status: ClaimStatus): string {
    const labels: Record<ClaimStatus, string> = {
      pending_materials: '待补充材料',
      under_review: '审核中',
      approved: '已通过',
      paid: '已赔付',
      rejected: '已驳回',
    };
    return labels[status];
  }
}
