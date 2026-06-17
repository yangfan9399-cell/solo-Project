<script setup lang="ts">import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '~/stores/gameStore';
import { getLevelById } from '~/data/levels';
import { formatTime } from '~/utils/gameLogic';
import type { GameRecord } from '~/types';
const router = useRouter();
const gameStore = useGameStore();
const selectedRecord = ref<GameRecord | null>(null);
const showDetail = ref(false);
function getLevelName(levelId: number): string {
 const level = getLevelById(levelId);
 return level?.name || `练习模式`;
}
function formatDate(dateStr: string): string {
 const date = new Date(dateStr);
 return date.toLocaleDateString('zh-CN', {
 year: 'numeric',
 month: '2-digit',
 day: '2-digit',
 hour: '2-digit',
 minute: '2-digit'
 });
}
function goBack() {
 router.push('/');
}
function openDetail(record: GameRecord) {
 selectedRecord.value = record;
 showDetail.value = true;
}
function closeDetail() {
 showDetail.value = false;
 selectedRecord.value = null;
}
function getErrorTypeLabel(errorType?: string): string {
 const labels: Record<string, string> = {
 calculation: '计算错误',
 carry: '进位错误',
 borrow: '借位错误',
 digit: '位数错误',
 other: '其他错误'
 };
 return labels[errorType || ''] || '';
}
function getOperationTypeLabel(type: string): string {
 const labels: Record<string, string> = {
 add: '得分',
 subtract: '答题',
 multiply: '乘法',
 divide: '除法',
 undo: '撤销',
 redo: '重做'
 };
 return labels[type] || type;
}
function formatOperationTime(timestamp: number): string {
 const date = new Date(timestamp);
 return date.toLocaleTimeString('zh-CN', {
 hour: '2-digit',
 minute: '2-digit',
 second: '2-digit'
 });
}
</script>

<template>
  <div class="records-container">
    <header class="header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>战绩记录</h1>
      <div class="empty"></div>
    </header>

    <main class="main-content">
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-value">{{ gameStore.gameRecords.length }}</div>
          <div class="summary-label">总游戏次数</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">
            {{ gameStore.gameRecords.reduce((sum, r) => sum + r.correctCount, 0) }}
          </div>
          <div class="summary-label">总答对题数</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">
            {{ gameStore.gameRecords.reduce((sum, r) => sum + r.score, 0) }}
          </div>
          <div class="summary-label">总得分</div>
        </div>
      </div>

      <div class="records-list">
        <div
          v-for="record in gameStore.gameRecords.slice().reverse()"
          :key="record.id"
          class="record-item"
          @click="openDetail(record)"
        >
          <div class="record-header">
            <div class="level-info">
              <span class="level-name">{{ getLevelName(record.levelId) }}</span>
              <span class="record-date">{{ formatDate(record.timestamp) }}</span>
            </div>
            <div class="record-score" :class="{ passed: record.score >= (getLevelById(record.levelId)?.requiredScore || 60) }">
              {{ record.score }}分
            </div>
          </div>

          <div class="record-details">
            <div class="detail-item">
              <span class="detail-label">答对</span>
              <span class="detail-value correct">{{ record.correctCount }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">答错</span>
              <span class="detail-value wrong">{{ record.wrongCount }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">用时</span>
              <span class="detail-value">{{ formatTime(record.timeUsed) }}</span>
            </div>
          </div>

          <div class="record-actions">
            <span class="view-detail">查看详情 →</span>
          </div>
        </div>

        <div v-if="gameStore.gameRecords.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <p>暂无游戏记录</p>
          <p class="empty-hint">完成游戏后将自动保存记录</p>
        </div>
      </div>
    </main>

    <div v-if="showDetail && selectedRecord" class="detail-modal" @click.self="closeDetail">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ getLevelName(selectedRecord.levelId) }}</h2>
          <button class="close-btn" @click="closeDetail">×</button>
        </div>

        <div class="modal-body">
          <div class="detail-summary">
            <div class="summary-row">
              <span class="summary-label">得分</span>
              <span class="summary-value score" :class="{ passed: selectedRecord.score >= (getLevelById(selectedRecord.levelId)?.requiredScore || 60) }">
                {{ selectedRecord.score }}
              </span>
            </div>
            <div class="summary-row">
              <span class="summary-label">用时</span>
              <span class="summary-value">{{ formatTime(selectedRecord.timeUsed) }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">正确率</span>
              <span class="summary-value">{{ Math.round((selectedRecord.correctCount / (selectedRecord.correctCount + selectedRecord.wrongCount)) * 100) }}%</span>
            </div>
          </div>

          <div class="section">
            <h3>操作历史</h3>
            <div v-if="selectedRecord.operationHistory && selectedRecord.operationHistory.length > 0" class="history-list">
              <div
                v-for="(op, index) in selectedRecord.operationHistory"
                :key="index"
                class="history-item"
              >
                <span class="history-index">{{ index + 1 }}</span>
                <span class="history-time">{{ formatOperationTime(op.timestamp) }}</span>
                <span class="history-type" :class="op.type">{{ getOperationTypeLabel(op.type) }}</span>
                <span class="history-value" :class="{ positive: op.value > 0 }">{{ op.value > 0 ? '+' : '' }}{{ op.value }}</span>
              </div>
            </div>
            <div v-else class="empty-history">
              暂无操作历史记录
            </div>
          </div>

          <div class="section">
            <h3>答题详情</h3>
            <div class="answers-list">
              <div
                v-for="answer in selectedRecord.answers"
                :key="answer.questionId"
                class="answer-item"
                :class="{ correct: answer.isCorrect, wrong: !answer.isCorrect }"
              >
                <div class="answer-status">
                  {{ answer.isCorrect ? '✓' : '✗' }}
                </div>
                <div class="answer-content">
                  <div class="answer-row">
                    <span class="label">你的答案</span>
                    <span class="value">{{ answer.playerAnswer }}</span>
                  </div>
                  <div class="answer-row">
                    <span class="label">正确答案</span>
                    <span class="value">{{ answer.correctAnswer }}</span>
                  </div>
                  <div v-if="!answer.isCorrect && answer.errorType" class="answer-row">
                    <span class="label">错误类型</span>
                    <span class="value error">{{ getErrorTypeLabel(answer.errorType) }}</span>
                  </div>
                  <div class="answer-row">
                    <span class="label">用时</span>
                    <span class="value">{{ answer.timeSpent.toFixed(1) }}秒</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.records-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  color: white;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header h1 {
  font-size: 24px;
}

.empty {
  width: 80px;
}

.main-content {
  max-width: 600px;
  margin: 0 auto;
}

.summary-cards {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.summary-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 20px;
  text-align: center;
}

.summary-value {
  font-size: 28px;
  font-weight: bold;
  color: #667eea;
}

.summary-label {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.record-item {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.record-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.level-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.level-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.record-date {
  font-size: 14px;
  color: #666;
}

.record-score {
  font-size: 24px;
  font-weight: bold;
  color: #F44336;
}

.record-score.passed {
  color: #4CAF50;
}

.record-details {
  display: flex;
  gap: 30px;
  margin-bottom: 10px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-label {
  font-size: 12px;
  color: #666;
}

.detail-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.detail-value.correct {
  color: #4CAF50;
}

.detail-value.wrong {
  color: #F44336;
}

.record-actions {
  text-align: right;
}

.view-detail {
  font-size: 14px;
  color: #667eea;
  font-weight: bold;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 18px;
  color: #666;
  margin-bottom: 10px;
}

.empty-hint {
  font-size: 14px;
  color: #999;
}

.detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(80vh - 80px);
}

.detail-summary {
  background: #f5f5f5;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #ddd;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-label {
  color: #666;
  font-size: 14px;
}

.summary-value {
  font-weight: bold;
  font-size: 16px;
}

.summary-value.score {
  color: #F44336;
}

.summary-value.score.passed {
  color: #4CAF50;
}

.section {
  margin-bottom: 20px;
}

.section h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 2px solid #667eea;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}

.history-index {
  width: 24px;
  height: 24px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.history-time {
  font-size: 12px;
  color: #999;
  width: 80px;
}

.history-type {
  flex: 1;
  font-size: 14px;
  font-weight: bold;
}

.history-type.add {
  color: #4CAF50;
}

.history-type.subtract {
  color: #F44336;
}

.history-value {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.history-value.positive {
  color: #4CAF50;
}

.empty-history {
  text-align: center;
  padding: 20px;
  color: #999;
  background: #f9f9f9;
  border-radius: 8px;
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.answer-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-radius: 10px;
}

.answer-item.correct {
  background: #e8f5e9;
  border-left: 4px solid #4CAF50;
}

.answer-item.wrong {
  background: #ffebee;
  border-left: 4px solid #F44336;
}

.answer-status {
  font-size: 20px;
  font-weight: bold;
  color: inherit;
}

.answer-content {
  flex: 1;
}

.answer-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.answer-row .label {
  font-size: 12px;
  color: #666;
}

.answer-row .value {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.answer-row .value.error {
  color: #F44336;
}

@media (max-width: 600px) {
  .summary-cards {
    flex-direction: column;
  }

  .record-details {
    gap: 20px;
  }
}
</style>