import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { LayoutComponent } from '../../shared/components/layout.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { RepairService } from '../../core/services/repair.service';
import { AuthService } from '../../core/services/auth.service';
import { Repair, RepairStatus, RepairItem } from '../../shared/models/repair.model';

@Component({
  selector: 'app-repair-detail',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    LayoutComponent,
    LoadingComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <app-layout>
      <div class="repair-detail">
        <div class="page-header">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>{{ isEdit ? '编辑维修记录' : '新增维修估价' }}</h1>
          <span class="status-badge" [class]="repair?.status" *ngIf="repair">
            {{ getStatusLabel(repair.status) }}
          </span>
        </div>

        <ng-container *ngIf="!loading; else loadingTemplate">
          <ng-container *ngIf="!error; else errorTemplate">
            <form [formGroup]="repairForm" (ngSubmit)="onSubmit()" class="repair-form">
              <mat-card class="form-card">
                <mat-card-header>
                  <mat-card-title>基本信息</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>预估完成时间</mat-label>
                      <input matInput [matDatepicker]="picker" formControlName="estimatedEndTime">
                      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                      <mat-datepicker #picker></mat-datepicker>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>开始时间</mat-label>
                      <input matInput [matDatepicker]="picker2" formControlName="startTime">
                      <mat-datepicker-toggle matSuffix [for]="picker2"></mat-datepicker-toggle>
                      <mat-datepicker #picker2></mat-datepicker>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>实际完成时间</mat-label>
                      <input matInput [matDatepicker]="picker3" formControlName="actualEndTime">
                      <mat-datepicker-toggle matSuffix [for]="picker3"></mat-datepicker-toggle>
                      <mat-datepicker #picker3></mat-datepicker>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>状态</mat-label>
                      <mat-select formControlName="status">
                        <mat-option value="pending">待开始</mat-option>
                        <mat-option value="in_progress">维修中</mat-option>
                        <mat-option value="completed">已完成</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>实际费用 (元)</mat-label>
                      <input matInput type="number" formControlName="actualCost" min="0" step="0.01">
                    </mat-form-field>
                  </div>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>备注</mat-label>
                    <textarea matInput formControlName="notes" rows="3"></textarea>
                  </mat-form-field>
                </mat-card-content>
              </mat-card>

              <mat-card class="form-card">
                <mat-card-header>
                  <mat-card-title>维修项明细</mat-card-title>
                  <button mat-raised-button color="primary" type="button" (click)="addItem()">
                    <mat-icon>add</mat-icon>
                    添加维修项
                  </button>
                </mat-card-header>
                <mat-card-content>
                  <div formArrayName="items" class="items-list">
                    <div class="item-header" *ngIf="items.length">
                      <span class="item-name">项目名称</span>
                      <span class="item-qty">数量</span>
                      <span class="item-price">单价 (元)</span>
                      <span class="item-subtotal">小计 (元)</span>
                      <span class="item-actions"></span>
                    </div>
                    <div *ngFor="let item of items.controls; let i = index" [formGroupName]="i" class="item-row">
                      <mat-form-field appearance="outline" class="item-name">
                        <mat-label>项目名称</mat-label>
                        <input matInput formControlName="name">
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="item-qty">
                        <mat-label>数量</mat-label>
                        <input matInput type="number" formControlName="quantity" min="1" step="1">
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="item-price">
                        <mat-label>单价</mat-label>
                        <input matInput type="number" formControlName="unitPrice" min="0" step="0.01">
                      </mat-form-field>
                      <span class="item-subtotal">¥{{ calculateSubtotal(i) }}</span>
                      <button mat-icon-button color="warn" type="button" (click)="removeItem(i)" class="item-actions">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                    <app-empty-state
                      *ngIf="!items.length"
                      icon="build"
                      title="暂无维修项"
                      description="点击上方按钮添加维修项目"
                    ></app-empty-state>
                  </div>
                  <mat-divider *ngIf="items.length"></mat-divider>
                  <div class="total-row" *ngIf="items.length">
                    <span class="total-label">预估总费用:</span>
                    <span class="total-value">¥{{ calculateTotal() }}</span>
                  </div>
                </mat-card-content>
              </mat-card>

              <div class="form-actions">
                <button mat-button type="button" (click)="goBack()">取消</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="repairForm.invalid || saving">
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
    .repair-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-card {
      margin-bottom: 16px;
    }
    .form-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
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
    .items-list {
      margin-top: 16px;
    }
    .item-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 48px;
      gap: 12px;
      padding: 0 8px 8px;
      font-weight: 500;
      color: #666;
      border-bottom: 2px solid #e0e0e0;
    }
    .item-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 48px;
      gap: 12px;
      align-items: center;
      padding: 12px 8px;
      border-bottom: 1px solid #f0f0f0;
    }
    .item-name, .item-qty, .item-price {
      margin-bottom: 0 !important;
    }
    .item-subtotal {
      font-weight: 500;
      text-align: right;
      padding-right: 12px;
    }
    .total-row {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 16px 8px 0;
      gap: 16px;
    }
    .total-label {
      font-size: 16px;
      color: #666;
    }
    .total-value {
      font-size: 20px;
      font-weight: 600;
      color: #3f51b5;
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
    .status-badge.pending { background: #fff3e0; color: #e65100; }
    .status-badge.in_progress { background: #ffebee; color: #c62828; }
    .status-badge.completed { background: #e8f5e9; color: #2e7d32; }
  `]
})
export class RepairDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private repairService = inject(RepairService);
  private authService = inject(AuthService);

  repairId?: string;
  accidentId?: string;
  repair: Repair | null = null;
  loading = true;
  error = false;
  saving = false;

  repairForm: FormGroup;

  get isEdit(): boolean {
    return !!this.repairId;
  }

  get items(): FormArray {
    return this.repairForm.get('items') as FormArray;
  }

  constructor() {
    this.repairForm = this.fb.group({
      estimatedEndTime: [''],
      startTime: [''],
      actualEndTime: [''],
      status: ['pending'],
      actualCost: [null],
      notes: [''],
      items: this.fb.array([]),
    });
  }

  ngOnInit() {
    this.repairId = this.route.snapshot.params['id'];
    this.accidentId = this.route.snapshot.queryParams['accidentId'];

    if (this.repairId) {
      this.loadData();
    } else {
      this.loading = false;
    }
  }

  loadData() {
    if (!this.repairId) return;
    
    this.loading = true;
    this.error = false;

    this.repairService.findOne(this.repairId).subscribe({
      next: (repair) => {
        this.repair = repair;
        this.patchForm(repair);
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  patchForm(repair: Repair) {
    this.repairForm.patchValue({
      estimatedEndTime: repair.estimatedEndTime ? new Date(repair.estimatedEndTime) : null,
      startTime: repair.startTime ? new Date(repair.startTime) : null,
      actualEndTime: repair.actualEndTime ? new Date(repair.actualEndTime) : null,
      status: repair.status,
      actualCost: repair.actualCost,
      notes: repair.notes,
    });

    if (repair.items && repair.items.length) {
      repair.items.forEach(item => {
        this.items.push(this.createItem(item));
      });
    }
  }

  createItem(item?: RepairItem): FormGroup {
    return this.fb.group({
      name: [item?.name || '', Validators.required],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(1)]],
      unitPrice: [item?.unitPrice || 0, [Validators.required, Validators.min(0)]],
    });
  }

  addItem() {
    this.items.push(this.createItem());
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  calculateSubtotal(index: number): string {
    const item = this.items.at(index).value;
    const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
    return subtotal.toFixed(2);
  }

  calculateTotal(): string {
    let total = 0;
    this.items.controls.forEach((control) => {
      const item = control.value;
      total += (item.quantity || 0) * (item.unitPrice || 0);
    });
    return total.toFixed(2);
  }

  onSubmit() {
    if (this.repairForm.invalid) return;

    this.saving = true;
    const formValue = this.repairForm.value;

    const request: any = {
      ...formValue,
      estimatedEndTime: formValue.estimatedEndTime ? formValue.estimatedEndTime.toISOString() : null,
      startTime: formValue.startTime ? formValue.startTime.toISOString() : null,
      actualEndTime: formValue.actualEndTime ? formValue.actualEndTime.toISOString() : null,
      items: formValue.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    if (this.isEdit && this.repairId) {
      delete request.accidentId;
      this.repairService.update(this.repairId, request).subscribe({
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
      this.repairService.create(request).subscribe({
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

  getStatusLabel(status: RepairStatus): string {
    const labels: Record<RepairStatus, string> = {
      pending: '待开始',
      in_progress: '维修中',
      completed: '已完成',
    };
    return labels[status];
  }

  goBack() {
    if (this.accidentId) {
      this.router.navigate(['/accidents', this.accidentId]);
    } else {
      this.router.navigate(['/repairs']);
    }
  }
}
