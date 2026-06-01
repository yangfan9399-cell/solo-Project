import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { LayoutComponent } from '../../shared/components/layout.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { AccidentService } from '../../core/services/accident.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { Vehicle } from '../../shared/models/accident.model';

@Component({
  selector: 'app-accident-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    LayoutComponent,
    LoadingComponent,
  ],
  template: `
    <app-layout>
      <div class="accident-form">
        <div class="page-header">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>事故报备</h1>
        </div>

        <mat-card>
          <form [formGroup]="accidentForm" (ngSubmit)="onSubmit()" class="form-content">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>选择车辆</mat-label>
                <mat-select formControlName="vehicleId">
                  <mat-option *ngFor="let vehicle of vehicles" [value]="vehicle.id">
                    {{ vehicle.plateNumber }} - {{ vehicle.model }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>事故时间</mat-label>
                <input matInput type="datetime-local" formControlName="accidentTime">
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>事故地点</mat-label>
              <input matInput formControlName="location" placeholder="请输入事故发生地点">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>事故原因</mat-label>
              <input matInput formControlName="cause" placeholder="请简要描述事故原因">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>详细描述</mat-label>
              <textarea matInput rows="4" formControlName="description" placeholder="请详细描述事故情况"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>伤亡人数</mat-label>
              <input matInput type="number" formControlName="casualties" min="0">
            </mat-form-field>

            <div class="form-actions">
              <button mat-button type="button" (click)="goBack()">取消</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="accidentForm.invalid || submitting">
                {{ submitting ? '提交中...' : '提交报备' }}
              </button>
            </div>
          </form>
        </mat-card>
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
    }
    .form-content {
      padding: 24px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .full-width {
      width: 100%;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
  `]
})
export class AccidentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private accidentService = inject(AccidentService);
  private vehicleService = inject(VehicleService);

  accidentForm: FormGroup;
  vehicles: Vehicle[] = [];
  submitting = false;

  constructor() {
    this.accidentForm = this.fb.group({
      vehicleId: ['', Validators.required],
      accidentTime: ['', Validators.required],
      location: ['', Validators.required],
      cause: [''],
      description: [''],
      casualties: [0],
    });
  }

  ngOnInit() {
    this.vehicleService.findAll('active').subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
      },
    });
  }

  onSubmit() {
    if (this.accidentForm.invalid) return;

    this.submitting = true;
    this.accidentService.create(this.accidentForm.value).subscribe({
      next: () => {
        this.router.navigate(['/accidents']);
      },
      error: () => {
        this.submitting = false;
      },
    });
  }

  goBack() {
    this.router.navigate(['/accidents']);
  }
}
