export type Priority = 'emergency' | 'important' | 'normal' | 'low';

export interface Caller {
  id: string;
  name: string;
  avatar: string;
  department: string;
}

export interface Call {
  id: string;
  caller: Caller;
  targetExtension: string;
  priority: Priority;
  arrivalTime: number;
  waitTime: number;
  status: 'waiting' | 'connected' | 'completed' | 'missed';
  connectedAt?: number;
  disconnectedAt?: number;
  expectedDisconnectTime?: number;
  isInterrupted?: boolean;
}

export interface Extension {
  id: string;
  number: string;
  name: string;
  department: string;
  status: 'available' | 'busy';
  currentCall?: Call;
}

export interface Action {
  id: string;
  type: 'connect' | 'disconnect' | 'interrupt' | 'hold' | 'transfer';
  timestamp: number;
  callId: string;
  fromExtension?: string;
  toExtension?: string;
  duration?: number;
  scoreChange: number;
  reason: string;
}

export interface Shift {
  id: string;
  level: number;
  startTime: number;
  endTime?: number;
  duration: number;
  callsHandled: number;
  callsMissed: number;
  emergencyCallsHandled: number;
  averageWaitTime: number;
  totalScore: number;
  actions: Action[];
  status: 'in-progress' | 'completed' | 'failed';
}

export interface PlayerProfile {
  id: string;
  name: string;
  level: number;
  totalScore: number;
  highestScore: number;
  shiftsCompleted: number;
  bestShiftId?: string;
  currentShift?: Shift;
  history: Shift[];
}

export interface LevelConfig {
  level: number;
  name: string;
  duration: number;
  maxExtensions: number;
  callInterval: number;
  emergencyChance: number;
  importantChance: number;
  lowChance: number;
  maxWaitTime: number;
  scoreMultiplier: number;
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  emergency: '#ef4444',
  important: '#f97316',
  normal: '#3b82f6',
  low: '#6b7280',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  emergency: '紧急',
  important: '重要',
  normal: '普通',
  low: '低优先级',
};
