import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LayoutComponent } from '../../shared/components/layout.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { AccidentService } from '../../core/services/accident.service';
import { RepairService } from '../../core/services/repair.service';
import { ClaimService } from '../../core/services/claim.service';
import { AttachmentService } from '../../core/services/attachment.service';
import { AuthService } from '../../core/services/auth.service';
import { Accident, StatusLog, AccidentStatus } from '../../shared/models/accident.model';
import { Repair } from '../../shared/models/repair.model';
import { Claim } from '../../shared/models/claim.model';
import { Attachment } from '../../shared/models/attachment.model';

@Component({
  selector: 'app-accident-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    LayoutComponent,
    LoadingComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <app-layout>
      <div class="accident-detail">
        <div class="page-header">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>事故详情 - {{ accident?.reportNo }}</h1>
          <span class="status-badge" [class]="accident?.status">{{ getStatusLabel(accident?.status) }}</span>
        </div>

        <ng-container *ngIf="!loading; else loadingTemplate">
          <ng-container *ngIf="!error && accident; else errorTemplate">
            <mat-tab-group>
              <mat-tab label="基本信息">
                <div class="tab-content">
                  <mat-card class="info-card">
                    <mat-card-header>
                      <mat-card-title>事故信息</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="info-grid">
                        <div class="info-item">
                          <label>报案号</label>
                          <span>{{ accident.reportNo }}</span>
                        </div>
                        <div class="info-item">
                          <label>车牌号</label>
                          <span>{{ accident.vehicle?.plateNumber }}</span>
                        </div>
                        <div class="info-item">
                          <label>车型</label>
                          <span>{{ accident.vehicle?.model }}</span>
                        </div>
                        <div class="info-item">
                          <label>事故时间</label>
                          <span>{{ formatDate(accident.accidentTime) }}</span>
                        </div>
                        <div class="info-item">
                          <label>事故地点</label>
                          <span>{{ accident.location }}</span>
                        </div>
                        <div class="info-item">
                          <label>伤亡人数</label>
                          <span>{{ accident.casualties }} 人</span>
                        </div>
                        <div class="info-item full-width">
                          <label>事故原因</label>
                          <span>{{ accident.cause || '未填写' }}</span>
                        </div>
                        <div class="info-item full-width">
                          <label>详细描述</label>
                          <span>{{ accident.description || '未填写' }}</span>
                        </div>
                        <div class="info-item">
                          <label>上报人</label>
                          <span>{{ accident.reporter?.name }}</span>
                        </div>
                        <div class="info-item">
                          <label>上报时间</label>
                          <span>{{ formatDate(accident.createdAt) }}</span>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="status-card" *ngIf="canUpdateStatus">
                    <mat-card-header>
                      <mat-card-title>状态变更</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <form [formGroup]="statusForm" (ngSubmit)="onStatusChange()" class="status-form">
                        <mat-form-field appearance="outline">
                          <mat-label>变更状态</mat-label>
                          <mat-select formControlName="status">
                            <mat-option value="pending_review">待审核</mat-option>
                            <mat-option value="reviewed">已审核</mat-option>
                            <mat-option value="in_repair">维修中</mat-option>
                            <mat-option value="in_claim">理赔中</mat-option>
                            <mat-option value="completed">已完成</mat-option>
                            <mat-option value="rejected">已驳回</mat-option>
                          </mat-select>
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>备注</mat-label>
                          <input matInput formControlName="remark" placeholder="请输入备注信息">
                        </mat-form-field>
                        <button mat-raised-button color="primary" type="submit" [disabled]="statusForm.invalid">
                          确认变更
                        </button>
                      </form>
                    </mat-card-content>
                  </mat-card>
                </div>
              </mat-tab>

              <mat-tab label="状态历史">
                <div class="tab-content">
                  <mat-card>
                    <mat-card-content>
                      <div class="timeline" *ngIf="statusLogs?.length; else noLogs">
                        <div class="timeline-item" *ngFor="let log of statusLogs">
                          <div class="timeline-dot"></div>
                          <div class="timeline-content">
                            <div class="timeline-header">
                              <span class="status-badge small" [class]="log.toStatus">{{ getStatusLabel(log.toStatus) }}</span>
                              <span class="timeline-time">{{ formatDate(log.createdAt) }}</span>
                            </div>
                            <p class="timeline-operator">操作人: {{ log.operator?.name }}</p>
                            <p class="timeline-remark" *ngIf="log.remark">备注: {{ log.remark }}</p>
                          </div>
                        </div>
                      </div>
                      <ng-template #noLogs>
                        <app-empty-state
                          icon="history"
                          title="暂无状态记录"
                          description="该事故还没有状态变更记录"
                        ></app-empty-state>
                      </ng-template>
                    </mat-card-content>
                  </mat-card>
                </div>
              </mat-tab>

              <mat-tab label="维修记录">
                <div class="tab-content">
                  <ng-container *ngIf="repairs?.length; else noRepairs">
                    <mat-card *ngFor="let repair of repairs" class="repair-card">
                      <mat-card-header>
                        <mat-card-title>维修估价 #{{ repair.id.slice(0, 8) }}</mat-card-title>
                        <span class="status-badge" [class]="repair.status">{{ getRepairStatusLabel(repair.status) }}</span>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="repair-info">
                          <p>预估费用: ¥{{ repair.estimatedCost }}</p>
                          <p *ngIf="repair.actualCost">实际费用: ¥{{ repair.actualCost }}</p>
                          <p>维修主管: {{ repair.repairManager?.name }}</p>
                          <p *ngIf="repair.notes">备注: {{ repair.notes }}</p>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </ng-container>
                  <ng-template #noRepairs>
                    <app-empty-state
                      icon="build"
                      title="暂无维修记录"
                      description="该事故还没有维修记录"
                    ></app-empty-state>
                  </ng-template>
                </div>
              </mat-tab>

              <mat-tab label="理赔记录">
                <div class="tab-content">
                  <ng-container *ngIf="claims?.length; else noClaims">
                    <mat-card *ngFor="let claim of claims" class="claim-card">
                      <mat-card-header>
                        <mat-card-title>理赔申请 #{{ claim.id.slice(0, 8) }}</mat-card-title>
                        <span class="status-badge" [class]="claim.status">{{ getClaimStatusLabel(claim.status) }}</span>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="claim-info">
                          <p *ngIf="claim.policyNo">保单号: {{ claim.policyNo }}</p>
                          <p *ngIf="claim.claimAmount">理赔金额: ¥{{ claim.claimAmount }}</p>
                          <p *ngIf="claim.paidAmount">已赔付: ¥{{ claim.paidAmount }}</p>
                          <p>保险专员: {{ claim.insuranceSpecialist?.name }}</p>
                          <p *ngIf="claim.notes">备注: {{ claim.notes }}</p>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </ng-container>
                  <ng-template #noClaims>
                    <app-empty-state
                      icon="receipt"
                      title="暂无理赔记录"
                      description="该事故还没有理赔记录"
                    ></app-empty-state>
                  </ng-template>
                </div>
              </mat-tab>

              <mat-tab label="材料附件">
                <div class="tab-content">
                  <mat-card>
                    <mat-card-header>
                      <mat-card-title>附件列表</mat-card-title>
                      <button mat-raised-button color="primary" (click)="fileInput.click()">
                        <mat-icon>upload</mat-icon>
                        上传附件
                      </button>
                      <input #fileInput type="file" hidden (change)="onFileUpload($event)">
                    </mat-card-header>
                    <mat-card-content>
                      <ng-container *ngIf="attachments?.length; else noAttachments">
                        <div class="attachment-list">
                          <div class="attachment-item" *ngFor="let attachment of attachments">
                            <mat-icon class="attachment-icon">attach_file</mat-icon>
                            <div class="attachment-info">
                              <p class="attachment-name">{{ attachment.fileName }}</p>
                              <p class="attachment-meta">{{ formatFileSize(attachment.fileSize) }} · {{ attachment.uploader?.name }}</p>
                            </div>
                            <button mat-icon-button (click)="downloadAttachment(attachment)">
                              <mat-icon>download</mat-icon>
                            </button>
                          </div>
                        </div>
                      </ng-container>
                      <ng-template #noAttachments>
                        <app-empty-state
                          icon="attach_file"
                          title="暂无附件"
                          description="该事故还没有上传附件材料"
                        ></app-empty-state>
                      </ng-template>
                    </mat-card-content>
                  </mat-card>
                </div>
              </mat-tab>
            </mat-tab-group>
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
    .tab-content {
      padding: 16px 0;
    }
    .info-card, .status-card {
      margin-bottom: 16px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .info-item.full-width {
      grid-column: 1 / -1;
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
    .status-form {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }
    .status-form mat-form-field {
      flex: 1;
    }
    .timeline {
      position: relative;
      padding-left: 24px;
    }
    .timeline-item {
      position: relative;
      padding-bottom: 24px;
    }
    .timeline-item:last-child {
      padding-bottom: 0;
    }
    .timeline-dot {
      position: absolute;
      left: -24px;
      top: 4px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #3f51b5;
    }
    .timeline-item:not(:last-child)::before {
      content: '';
      position: absolute;
      left: -19px;
      top: 16px;
      width: 2px;
      height: calc(100% - 16px);
      background: #e0e0e0;
    }
    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .timeline-time {
      font-size: 12px;
      color: #999;
    }
    .timeline-operator, .timeline-remark {
      margin: 4px 0;
      font-size: 13px;
      color: #666;
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-badge.small {
      font-size: 11px;
      padding: 2px 8px;
    }
    .status-badge.pending_review { background: #fff3e0; color: #e65100; }
    .status-badge.reviewed { background: #e3f2fd; color: #1565c0; }
    .status-badge.in_repair { background: #ffebee; color: #c62828; }
    .status-badge.in_claim { background: #f3e5f5; color: #7b1fa2; }
    .status-badge.completed { background: #e8f5e9; color: #2e7d32; }
    .status-badge.rejected { background: #ffebee; color: #c62828; }
    .repair-card, .claim-card {
      margin-bottom: 16px;
    }
    .repair-card mat-card-header, .claim-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .repair-info p, .claim-info p {
      margin: 8px 0;
      font-size: 14px;
    }
    .attachment-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .attachment-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .attachment-icon {
      color: #666;
    }
    .attachment-info {
      flex: 1;
    }
    .attachment-name {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
    }
    .attachment-meta {
      margin: 2px 0 0 0;
      font-size: 12px;
      color: #999;
    }
  `]
})
export class AccidentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private accidentService = inject(AccidentService);
  private repairService = inject(RepairService);
  private claimService = inject(ClaimService);
  private attachmentService = inject(AttachmentService);
  private authService = inject(AuthService);

  accidentId!: string;
  accident: Accident | null = null;
  statusLogs: StatusLog[] = [];
  repairs: Repair[] = [];
  claims: Claim[] = [];
  attachments: Attachment[] = [];
  loading = true;
  error = false;

  statusForm: FormGroup;

  get canUpdateStatus(): boolean {
    return this.authService.hasRole(['dispatcher', 'repair_manager', 'insurance_specialist']);
  }

  constructor() {
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
      remark: [''],
    });
  }

  ngOnInit() {
    this.accidentId = this.route.snapshot.params['id'];
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = false;

    this.accidentService.findOne(this.accidentId).subscribe({
      next: (accident) => {
        this.accident = accident;
        this.statusForm.patchValue({ status: accident.status });
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });

    this.accidentService.getStatusLogs(this.accidentId).subscribe({
      next: (logs) => {
        this.statusLogs = logs;
      },
    });

    this.repairService.findByAccident(this.accidentId).subscribe({
      next: (repairs) => {
        this.repairs = repairs;
      },
    });

    this.claimService.findByAccident(this.accidentId).subscribe({
      next: (claims) => {
        this.claims = claims;
      },
    });

    this.attachmentService.findByAccident(this.accidentId).subscribe({
      next: (attachments) => {
        this.attachments = attachments;
        this.loading = false;
      },
    });
  }

  onStatusChange() {
    if (this.statusForm.invalid) return;

    this.accidentService.updateStatus(this.accidentId, this.statusForm.value).subscribe({
      next: () => {
        this.loadData();
      },
    });
  }

  onFileUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.attachmentService.upload(file, 'scene', this.accidentId).subscribe({
        next: () => {
          this.loadData();
        },
      });
    }
  }

  downloadAttachment(attachment: Attachment) {
    window.open(this.attachmentService.getDownloadUrl(attachment.id), '_blank');
  }

  formatDate(date: any): string {
    return new Date(date).toLocaleString('zh-CN');
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getStatusLabel(status?: AccidentStatus): string {
    if (!status) return '';
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

  getRepairStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: '待开始',
      in_progress: '进行中',
      completed: '已完成',
    };
    return labels[status] || status;
  }

  getClaimStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending_materials: '待材料',
      under_review: '审核中',
      approved: '已批准',
      paid: '已赔付',
      rejected: '已拒绝',
    };
    return labels[status] || status;
  }

  goBack() {
    this.router.navigate(['/accidents']);
  }
}
