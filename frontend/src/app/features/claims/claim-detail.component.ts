import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LayoutComponent } from '../../shared/components/layout.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { ClaimService } from '../../core/services/claim.service';
import { AuthService } from '../../core/services/auth.service';
import { Claim, ClaimStatus } from '../../shared/models/claim.model';

@Component({
  selector: 'app-claim-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    LayoutComponent,
    LoadingComponent,
    ErrorStateComponent,
  ],
  template: `
    <app-layout>
      <div class="claim-detail">
        <div class="page-header">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>{{ isEdit ? '编辑理赔记录' : '新增理赔申请' }}</h1>
          <span class="status-badge" [class]="claim?.status" *ngIf="claim">
            {{ getStatusLabel(claim.status) }}
          </span>
        </div>

        <ng-container *ngIf="!loading; else loadingTemplate">
          <ng-container *ngIf="!error; else errorTemplate">
            <form [formGroup]="claimForm" (ngSubmit)="onSubmit()" class="claim-form">
              <mat-card class="form-card">
                <mat-card-header>
                  <mat-card-title>基本信息</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>保单号</mat-label>
                      <input matInput formControlName="policyNo" placeholder="请输入保单号">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>理赔金额 (元)</mat-label>
                      <input matInput type="number" formControlName="claimAmount" min="0" step="0.01">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>已赔付金额 (元)</mat-label>
                      <input matInput type="number" formControlName="paidAmount" min="0" step="0.01">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>理赔状态</mat-label>
                      <mat-select formControlName="status">
                        <mat-option value="pending_materials">待补充材料</mat-option>
                        <mat-option value="under_review">审核中</mat-option>
                        <mat-option value="approved">已通过</mat-option>
                        <mat-option value="paid">已赔付</mat-option>
                        <mat-option value="rejected">已驳回</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>材料备注</mat-label>
                    <textarea matInput formControlName="notes" rows="4" placeholder="请输入材料备注或补充说明"></textarea>
                  </mat-form-field>
                </mat-card-content>
              </mat-card>

              <mat-card class="form-card" *ngIf="claim">
                <mat-card-header>
                  <mat-card-title>审核信息</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="info-grid">
                    <div class="info-item">
                      <label>保险专员</label>
                      <span>{{ claim.insuranceSpecialist?.name || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <label>创建时间</label>
                      <span>{{ formatDate(claim.createdAt) }}</span>
                    </div>
                    <div class="info-item">
                      <label>更新时间</label>
                      <span>{{ formatDate(claim.updatedAt) }}</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <div class="form-actions">
                <button mat-button type="button" (click)="goBack()">取消</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="claimForm.invalid || saving">
                  <mat-icon *ngIf="saving">sync</mat-icon>
                  {{ saving ? '保存中...' : '保存' }}
                </button>
              </div>
            </form>
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
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .page-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      flex: 1;
    }
    .claim-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-card {
      margin-bottom: 16px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .full-width {
      width: 100%;
      margin-top: 16px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .info-item label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    .info-item span {
      font-size: 14px;
      font-weight: 500;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
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
  `]
})
export class ClaimDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private claimService = inject(ClaimService);
  private authService = inject(AuthService);

  claimId?: string;
  accidentId?: string;
  claim: Claim | null = null;
  loading = true;
  error = false;
  saving = false;

  claimForm: FormGroup;

  get isEdit(): boolean {
    return !!this.claimId;
  }

  constructor() {
    this.claimForm = this.fb.group({
      policyNo: [''],
      claimAmount: [null],
      paidAmount: [null],
      status: ['pending_materials', Validators.required],
      notes: [''],
    });
  }

  ngOnInit() {
    this.claimId = this.route.snapshot.params['id'];
    this.accidentId = this.route.snapshot.queryParams['accidentId'];

    if (this.claimId) {
      this.loadData();
    } else {
      this.loading = false;
    }
  }

  loadData() {
    if (!this.claimId) return;
    
    this.loading = true;
    this.error = false;

    this.claimService.findOne(this.claimId).subscribe({
      next: (claim) => {
        this.claim = claim;
        this.patchForm(claim);
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  patchForm(claim: Claim) {
    this.claimForm.patchValue({
      policyNo: claim.policyNo,
      claimAmount: claim.claimAmount,
      paidAmount: claim.paidAmount,
      status: claim.status,
      notes: claim.notes,
    });
  }

  onSubmit() {
    if (this.claimForm.invalid) return;

    this.saving = true;
    const formValue = this.claimForm.value;

    const request: any = {
      ...formValue,
    };

    if (this.isEdit && this.claimId) {
      delete request.accidentId;
      this.claimService.update(this.claimId, request).subscribe({
        next: () => {
          this.saving = false;
          this.goBack();
        },
        error: () => {
          this.saving = false;
        },
      });
    } else if (this.accidentId) {
      request.accidentId = this.accidentId;
      this.claimService.create(request).subscribe({
        next: () => {
          this.saving = false;
          this.goBack();
        },
        error: () => {
          this.saving = false;
        },
      });
    }
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

  goBack() {
    if (this.accidentId) {
      this.router.navigate(['/accidents', this.accidentId]);
    } else {
      this.router.navigate(['/claims']);
    }
  }
}
