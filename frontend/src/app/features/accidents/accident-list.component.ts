import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { AccidentService } from '../../core/services/accident.service';
import { AuthService } from '../../core/services/auth.service';
import { Accident, AccidentStatus } from '../../shared/models/accident.model';
import { PaginatedResult } from '../../shared/models/accident.model';

@Component({
  selector: 'app-accident-list',
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
      <div class="accident-list">
        <div class="page-header">
          <h1>事故管理</h1>
          <button mat-raised-button color="primary" *ngIf="canCreate" (click)="goToCreate()">
            <mat-icon>add</mat-icon>
            报备事故
          </button>
        </div>

        <mat-card class="filter-card">
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>状态筛选</mat-label>
              <mat-select [formControl]="statusControl">
                <mat-option value="">全部状态</mat-option>
                <mat-option value="pending_review">待审核</mat-option>
                <mat-option value="reviewed">已审核</mat-option>
                <mat-option value="in_repair">维修中</mat-option>
                <mat-option value="in_claim">理赔中</mat-option>
                <mat-option value="completed">已完成</mat-option>
                <mat-option value="rejected">已驳回</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>查看</mat-label>
              <mat-select [formControl]="mineControl">
                <mat-option [value]="false">全部事故</mat-option>
                <mat-option [value]="true">我上报的</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card>

        <ng-container *ngIf="!loading; else loadingTemplate">
          <ng-container *ngIf="!error; else errorTemplate">
            <mat-card>
              <ng-container *ngIf="data?.data?.length; else emptyTemplate">
                <table mat-table [dataSource]="data.data">
                  <ng-container matColumnDef="reportNo">
                    <th mat-header-cell *matHeaderCellDef>报案号</th>
                    <td mat-cell *matCellDef="let row">{{ row.reportNo }}</td>
                  </ng-container>
                  <ng-container matColumnDef="vehicle">
                    <th mat-header-cell *matHeaderCellDef>车辆</th>
                    <td mat-cell *matCellDef="let row">{{ row.vehicle?.plateNumber }}</td>
                  </ng-container>
                  <ng-container matColumnDef="location">
                    <th mat-header-cell *matHeaderCellDef>地点</th>
                    <td mat-cell *matCellDef="let row">{{ row.location }}</td>
                  </ng-container>
                  <ng-container matColumnDef="accidentTime">
                    <th mat-header-cell *matHeaderCellDef>发生时间</th>
                    <td mat-cell *matCellDef="let row">{{ formatDate(row.accidentTime) }}</td>
                  </ng-container>
                  <ng-container matColumnDef="reporter">
                    <th mat-header-cell *matHeaderCellDef>上报人</th>
                    <td mat-cell *matCellDef="let row">{{ row.reporter?.name }}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>状态</th>
                    <td mat-cell *matCellDef="let row">
                      <span class="status-badge" [class]="row.status]">{{ getStatusLabel(row.status) }}</span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>操作</th>
                    <td mat-cell *matCellDef="let row">
                      <button mat-icon-button color="primary" (click)="goToDetail(row.id)">
                        <mat-icon>visibility</mat-icon>
                      </button>
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
              <ng-template #emptyTemplate">
                <app-empty-state
                  icon="inbox"
                  title="暂无事故记录"
                  description="系统中还没有事故记录，点击上方按钮报备新事故"
                >
                  <button mat-raised-button color="primary" *ngIf="canCreate" (click)="goToCreate()">
                    <mat-icon>add</mat-icon>
                    报备事故
                  </button>
                </app-empty-state>
              </ng-template>
            </mat-card>
          </ng-container>
          <ng-template #errorTemplate">
            <app-error-state (retry)="loadData()"></app-error-state>
          </ng-template>
        </ng-container>
        <ng-template #loadingTemplate">
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
    .status-badge.pending_review { background: #fff3e0; color: #e65100; }
    .status-badge.reviewed { background: #e3f2fd; color: #1565c0; }
    .status-badge.in_repair { background: #ffebee; color: #c62828; }
    .status-badge.in_claim { background: #f3e5f5; color: #7b1fa2; }
    .status-badge.completed { background: #e8f5e9; color: #2e7d32; }
    .status-badge.rejected { background: #ffebee; color: #c62828; }
    mat-table {
      width: 100%;
    }
  `]
})
export class AccidentListComponent implements OnInit {
  private accidentService = inject(AccidentService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = true;
  error = false;
  data: PaginatedResult<Accident> = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  displayedColumns = ['reportNo', 'vehicle', 'location', 'accidentTime', 'reporter', 'status', 'actions'];
  statusControl = new FormControl('');
  mineControl = new FormControl(false);
  pageIndex = 1;
  pageSize = 10;

  get canCreate(): boolean {
    return this.authService.hasRole(['driver', 'dispatcher']);
  }

  ngOnInit() {
    this.loadData();

    this.statusControl.valueChanges.subscribe(() => {
      this.pageIndex = 1;
      this.loadData();
    });

    this.mineControl.valueChanges.subscribe(() => {
      this.pageIndex = 1;
      this.loadData();
    });
  }

  loadData() {
    this.loading = true;
    this.error = false;

    this.accidentService.findAll(
      this.pageIndex,
      this.pageSize,
      this.statusControl.value || undefined,
      this.mineControl.value || undefined
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

  getStatusLabel(status: AccidentStatus): string {
    const labels: Record<AccidentStatus, string> = {
      pending_review: '待审核',
      reviewed: '已审核',
      in_repair: '维修中',
      in_claim: '理赔中',
      completed: '已完成',
      rejected: '已驳回',
    };
    return labels[status];
  }

  goToCreate() {
    this.router.navigate(['/accidents/new']);
  }

  goToDetail(id: string) {
    this.router.navigate(['/accidents', id]);
  }
}
