import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="error-state">
      <div class="error-icon">
        <mat-icon [inline]="true" [style.font-size.px]="64">error_outline</mat-icon>
      </div>
      <h3 class="error-title">{{ title }}</h3>
      <p class="error-description">{{ message }}</p>
      <button mat-raised-button color="primary" (click)="retry.emit()">
        <mat-icon>refresh</mat-icon>
        重试
      </button>
    </div>
  `,
  styles: [`
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 40px;
      text-align: center;
    }
    .error-icon {
      color: #f44336;
      margin-bottom: 16px;
    }
    .error-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 500;
      color: #333;
    }
    .error-description {
      margin: 0 0 24px 0;
      font-size: 14px;
      color: #666;
      max-width: 400px;
    }
  `]
})
export class ErrorStateComponent {
  @Input() title = '加载失败';
  @Input() message = '抱歉，数据加载出现问题，请重试';
  @Output() retry = new EventEmitter<void>();
}
