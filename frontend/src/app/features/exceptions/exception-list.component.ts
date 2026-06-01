import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { LayoutComponent } from '../../shared/components/layout.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { ExceptionService } from '../../core/services/exception.service';
import { AuthService } from '../../core/services/auth.service';
import { Exception, ExceptionStatus } from '../../shared/models/exception.model';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Component({
  selector: 'app-exception-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
  ],
  template: `
    <h2 mat-dialog-title>提交异常反馈</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="exception-form">
        <mat-form-field appearance="outline">
          <mat-label>标题</mat-label>
          <input matInput formControlName="title" placeholder="请输入异常标题">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>详细描述</mat-label>
          <textarea matInput formControlName="description" rows="4" placeholder="请详细描述异常情况"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="primary" [disabled]="!form.valid" (click)="onSubmit()">提交</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .exception-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
    }
  `]
})
export class ExceptionDialogComponent {
  private exceptionService = inject(ExceptionService);
  private dialogRef = inject(MatDialogRef);

  form = new FormGroup({
    title: new FormControl('', [Validators.required]),
    description: new FormControl(''),
  });

  onSubmit() {
    if (this.form.valid) {
      this.exceptionService.create({
        title: this.form.value.title!,
        description: this.form.value.description,
      }).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: () => {
          alert('提交失败，请重试');
        }
      });
    }
  }
}

@Component({
  selector: 'app-exception-list',
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
    MatDialogModule,
    LayoutComponent,
    LoadingComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <app-layout>
      <div class="exception-list">
        <div class="page-header">
          <h1>异常反馈</h1>
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            提交反馈
          </button>
        </div>

        <mat-card class="filter-card">
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>状态筛选</mat-label>
              <mat-select [formControl]="statusControl">
                <mat-option value="">全部状态</mat-option>
                <mat-option value="pending">待处理</mat-option>
                <mat-option value="processing">处理中</mat-option>
                <mat-option value="resolved">已解决</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>查看</mat-label>
              <mat-select [formControl]="mineControl">
                <mat-option [value]="false">全部反馈</mat-option>
                <mat-option [value]="true">我提交的</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card>

        <ng-container *ngIf="!loading; else loadingTemplate">
          <ng-container *ngIf="!error; else errorTemplate">
            <mat-card>
              <ng-container *ngIf="data?.data?.length; else emptyTemplate">
                <table mat-table [dataSource]="data.data">
                  <ng-container matColumnDef="title">
                    <th mat-header-cell *matHeaderCellDef>标题</th>
                    <td mat-cell *matCellDef="let row">{{ row.title }}</td>
                  </ng-container>
                  <ng-container matColumnDef="reporter">
                    <th mat-header-cell *matHeaderCellDef>提交人</th>
                    <td mat-cell *matCellDef="let row">{{ row.reporter?.name || '-' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="handler">
                    <th mat-header-cell *matHeaderCellDef>处理人</th>
                    <td mat-cell *matCellDef="let row">{{ row.handler?.name || '-' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="accident">
                    <th mat-header-cell *matHeaderCellDef>关联事故</th>
                    <td mat-cell *matCellDef="let row">{{ row.accident?.reportNo || '-' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="createdAt">
                    <th mat-header-cell *matHeaderCellDef>提交时间</th>
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
                  icon="warning"
                  title="暂无异常反馈"
                  description="系统中还没有异常反馈，遇到问题请点击上方按钮提交"
                >
                  <button mat-raised-button color="primary" (click)="openCreateDialog()">
                    <mat-icon>add</mat-icon>
                    提交反馈
                  </button>
                </app-empty-state>
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
    .status-badge.processing { background: #e3f2fd; color: #1565c0; }
    .status-badge.resolved { background: #e8f5e9; color: #2e7d32; }
    mat-table {
      width: 100%;
    }
  `]
})
export class ExceptionListComponent implements OnInit {
  private exceptionService = inject(ExceptionService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  loading = true;
  error = false;
  data: PaginatedResult<Exception> = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  displayedColumns = ['title', 'reporter', 'handler', 'accident', 'createdAt', 'status'];
  statusControl = new FormControl('');
  mineControl = new FormControl(false);
  pageIndex = 1;
  pageSize = 10;

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

    this.exceptionService.findAll(
      this.pageIndex,
      this.pageSize,
      this.statusControl.value || undefined
    ).subscribe({
      next: (result) => {
        if (this.mineControl.value) {
          const userId = this.authService.currentUser?.id;
          result.data = result.data.filter((e: Exception) => e.reporterId === userId);
          result.total = result.data.length;
        }
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

  getStatusLabel(status: ExceptionStatus): string {
    const labels: Record<ExceptionStatus, string> = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
    };
    return labels[status];
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(ExceptionDialogComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadData();
      }
    });
  }
}
