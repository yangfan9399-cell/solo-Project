import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  GameSession,
  BoardAdjustments,
  ToneProfile,
  OperationRecord,
  ScoreResult,
  CustomerFeedback,
  FinishedInstrument,
  SoundSample,
} from '@/types/game';
import {
  calculateToneFromAdjustments,
  generateSoundSpectrum,
  generateCustomerFeedback,
} from '@/utils/toneCalculator';
import {
  saveSession,
  loadSession,
  saveCurrentSessionId,
  generateId,
  saveInstrument,
} from '@/utils/storage';
import { INITIAL_LEVELS, WOOD_TYPES } from '@/data/levels';

const DEFAULT_ADJUSTMENTS: BoardAdjustments = {
  woodThickness: 3,
  beamPosition: 50,
  lacquerLayer: 2,
  soundHoleSize: 85,
  braceAngle: 20,
};

const FIELD_NAMES: Record<keyof BoardAdjustments, string> = {
  woodThickness: '木材厚度',
  beamPosition: '梁位',
  lacquerLayer: '漆层',
  soundHoleSize: '音孔尺寸',
  braceAngle: '支撑角',
};

function replayAdjustments(operations: OperationRecord[], upToIndex: number): BoardAdjustments {
  const adj = { ...DEFAULT_ADJUSTMENTS };
  for (let i = 0; i <= upToIndex; i++) {
    const op = operations[i];
    if (op.type === 'reset') {
      Object.assign(adj, DEFAULT_ADJUSTMENTS);
    } else if (op.type === 'adjust' && op.field && op.newValue !== undefined) {
      adj[op.field] = op.newValue;
    }
  }
  return adj;
}

export function useGameSession({ levelId, playerId }: { levelId: string; playerId: string }) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentTone, setCurrentTone] = useState<ToneProfile | null>(null);
  const [currentSpectrum, setCurrentSpectrum] = useState<SoundSample[]>([]);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [feedback, setFeedback] = useState<CustomerFeedback | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'evaluating' | 'won' | 'lost'>('idle');
  const [selectedWood, setSelectedWood] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);

  const sessionRef = useRef<GameSession | null>(null);
  const selectedWoodRef = useRef('');
  const startTimeRef = useRef(0);

  useEffect(() => {
    sessionRef.current = session;
    if (session) startTimeRef.current = session.startTime;
  }, [session]);

  useEffect(() => {
    selectedWoodRef.current = selectedWood;
  }, [selectedWood]);

  useEffect(() => {
    if (gameStatus === 'playing') {
      const id = setInterval(() => {
        setTimeSpent(Date.now() - startTimeRef.current);
      }, 1000);
      return () => clearInterval(id);
    }
  }, [gameStatus]);

  const startSession = useCallback((woodTypeId: string) => {
    const adjustments = { ...DEFAULT_ADJUSTMENTS };
    const tone = calculateToneFromAdjustments(adjustments, woodTypeId);
    const level = INITIAL_LEVELS.find(l => l.id === levelId);
    const baseFreq = level?.targetSoundSpectrum[0]?.frequency ?? 196;
    const spectrum = generateSoundSpectrum(adjustments, baseFreq);
    const newSession: GameSession = {
      id: generateId(),
      levelId,
      playerId,
      startTime: Date.now(),
      adjustments,
      currentTone: tone,
      operationHistory: [],
      historyIndex: -1,
      status: 'playing',
    };
    setSession(newSession);
    setCurrentTone(tone);
    setCurrentSpectrum(spectrum);
    setScoreResult(null);
    setFeedback(null);
    setIsEvaluating(false);
    setGameStatus('playing');
    setSelectedWood(woodTypeId);
    selectedWoodRef.current = woodTypeId;
    setTimeSpent(0);
    saveSession(newSession);
    saveCurrentSessionId(newSession.id);
  }, [levelId, playerId]);

  const resumeSession = useCallback((sessionId: string) => {
    const loaded = loadSession(sessionId);
    if (!loaded) return;
    const level = INITIAL_LEVELS.find(l => l.id === loaded.levelId);
    const woodId = level?.woodTypes[0] ?? WOOD_TYPES[0].id;
    const tone = calculateToneFromAdjustments(loaded.adjustments, woodId);
    const baseFreq = level?.targetSoundSpectrum[0]?.frequency ?? 196;
    const spectrum = generateSoundSpectrum(loaded.adjustments, baseFreq);
    const status: 'idle' | 'playing' | 'evaluating' | 'won' | 'lost' =
      loaded.status === 'won' ? 'won' : loaded.status === 'lost' ? 'lost' : 'playing';
    setSession(loaded);
    setCurrentTone(tone);
    setCurrentSpectrum(spectrum);
    setScoreResult(null);
    setFeedback(loaded.feedback ?? null);
    setIsEvaluating(false);
    setGameStatus(status);
    setSelectedWood(woodId);
    selectedWoodRef.current = woodId;
    startTimeRef.current = loaded.startTime;
    setTimeSpent(Date.now() - loaded.startTime);
    saveCurrentSessionId(loaded.id);
  }, []);

  const adjustField = useCallback((field: keyof BoardAdjustments, value: number) => {
    const prev = sessionRef.current;
    if (!prev) return;
    const woodId = selectedWoodRef.current;
    const oldValue = prev.adjustments[field];
    const operation: OperationRecord = {
      id: generateId(),
      timestamp: Date.now(),
      type: 'adjust',
      field,
      oldValue,
      newValue: value,
      description: `调整${FIELD_NAMES[field]} 从 ${oldValue} 到 ${value}`,
    };
    const newHistory = [...prev.operationHistory.slice(0, prev.historyIndex + 1), operation];
    const newAdjustments = { ...prev.adjustments, [field]: value };
    const tone = calculateToneFromAdjustments(newAdjustments, woodId);
    const level = INITIAL_LEVELS.find(l => l.id === prev.levelId);
    const baseFreq = level?.targetSoundSpectrum[0]?.frequency ?? 196;
    const spectrum = generateSoundSpectrum(newAdjustments, baseFreq);
    const newSession: GameSession = {
      ...prev,
      adjustments: newAdjustments,
      currentTone: tone,
      operationHistory: newHistory,
      historyIndex: newHistory.length - 1,
    };
    setSession(newSession);
    setCurrentTone(tone);
    setCurrentSpectrum(spectrum);
    saveSession(newSession);
    saveCurrentSessionId(newSession.id);
  }, []);

  const undo = useCallback(() => {
    const prev = sessionRef.current;
    if (!prev || prev.historyIndex < 0) return;
    const newIndex = prev.historyIndex - 1;
    const woodId = selectedWoodRef.current;
    const newAdjustments = newIndex < 0
      ? { ...DEFAULT_ADJUSTMENTS }
      : replayAdjustments(prev.operationHistory, newIndex);
    const tone = calculateToneFromAdjustments(newAdjustments, woodId);
    const level = INITIAL_LEVELS.find(l => l.id === prev.levelId);
    const baseFreq = level?.targetSoundSpectrum[0]?.frequency ?? 196;
    const spectrum = generateSoundSpectrum(newAdjustments, baseFreq);
    const newSession: GameSession = {
      ...prev,
      adjustments: newAdjustments,
      currentTone: tone,
      historyIndex: newIndex,
    };
    setSession(newSession);
    setCurrentTone(tone);
    setCurrentSpectrum(spectrum);
    saveSession(newSession);
    saveCurrentSessionId(newSession.id);
  }, []);

  const redo = useCallback(() => {
    const prev = sessionRef.current;
    if (!prev || prev.historyIndex >= prev.operationHistory.length - 1) return;
    const newIndex = prev.historyIndex + 1;
    const woodId = selectedWoodRef.current;
    const newAdjustments = replayAdjustments(prev.operationHistory, newIndex);
    const tone = calculateToneFromAdjustments(newAdjustments, woodId);
    const level = INITIAL_LEVELS.find(l => l.id === prev.levelId);
    const baseFreq = level?.targetSoundSpectrum[0]?.frequency ?? 196;
    const spectrum = generateSoundSpectrum(newAdjustments, baseFreq);
    const newSession: GameSession = {
      ...prev,
      adjustments: newAdjustments,
      currentTone: tone,
      historyIndex: newIndex,
    };
    setSession(newSession);
    setCurrentTone(tone);
    setCurrentSpectrum(spectrum);
    saveSession(newSession);
    saveCurrentSessionId(newSession.id);
  }, []);

  const resetAdjustments = useCallback(() => {
    const prev = sessionRef.current;
    if (!prev) return;
    const woodId = selectedWoodRef.current;
    const operation: OperationRecord = {
      id: generateId(),
      timestamp: Date.now(),
      type: 'reset',
      description: '重置所有调整参数',
    };
    const newHistory = [...prev.operationHistory.slice(0, prev.historyIndex + 1), operation];
    const newAdjustments = { ...DEFAULT_ADJUSTMENTS };
    const tone = calculateToneFromAdjustments(newAdjustments, woodId);
    const level = INITIAL_LEVELS.find(l => l.id === prev.levelId);
    const baseFreq = level?.targetSoundSpectrum[0]?.frequency ?? 196;
    const spectrum = generateSoundSpectrum(newAdjustments, baseFreq);
    const newSession: GameSession = {
      ...prev,
      adjustments: newAdjustments,
      currentTone: tone,
      operationHistory: newHistory,
      historyIndex: newHistory.length - 1,
    };
    setSession(newSession);
    setCurrentTone(tone);
    setCurrentSpectrum(spectrum);
    saveSession(newSession);
    saveCurrentSessionId(newSession.id);
  }, []);

  const evaluate = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    setIsEvaluating(true);
    setGameStatus('evaluating');
    try {
      const level = INITIAL_LEVELS.find(l => l.id === s.levelId);
      const woodId = selectedWoodRef.current;
      const baseFreq = level?.targetSoundSpectrum[0]?.frequency ?? 196;
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustments: s.adjustments,
          woodTypeId: woodId,
          targetTone: level?.targetTone,
          targetSpectrum: level?.targetSoundSpectrum,
          baseFreq,
          operationCount: s.operationHistory.length,
          timeSpent: Date.now() - s.startTime,
          idealAdjustments: level?.idealAdjustments,
        }),
      });
      const result: ScoreResult = await response.json();
      const fb = generateCustomerFeedback(result.toneMatchScore, result.totalScore, result.details.tone);
      const won = result.totalScore >= 50;
      const newStatus: 'won' | 'lost' = won ? 'won' : 'lost';
      const newSession: GameSession = {
        ...s,
        status: newStatus,
        score: result.totalScore,
        feedback: fb,
        endTime: Date.now(),
      };
      setScoreResult(result);
      setFeedback(fb);
      setGameStatus(newStatus);
      setSession(newSession);
      saveSession(newSession);
      saveCurrentSessionId(newSession.id);
      if (won) {
        const instrument: FinishedInstrument = {
          id: generateId(),
          name: `乐器_${s.id}`,
          sessionId: s.id,
          levelId: s.levelId,
          adjustments: s.adjustments,
          finalTone: calculateToneFromAdjustments(s.adjustments, woodId),
          score: result.totalScore,
          customerFeedback: fb,
          createdAt: Date.now(),
        };
        saveInstrument(instrument);
      }
    } catch {
      setGameStatus('playing');
    } finally {
      setIsEvaluating(false);
    }
  }, []);

  const selectWood = useCallback((woodTypeId: string) => {
    const s = sessionRef.current;
    setSelectedWood(woodTypeId);
    selectedWoodRef.current = woodTypeId;
    if (!s) return;
    const tone = calculateToneFromAdjustments(s.adjustments, woodTypeId);
    const level = INITIAL_LEVELS.find(l => l.id === s.levelId);
    const baseFreq = level?.targetSoundSpectrum[0]?.frequency ?? 196;
    const spectrum = generateSoundSpectrum(s.adjustments, baseFreq);
    const newSession: GameSession = {
      ...s,
      currentTone: tone,
    };
    setSession(newSession);
    setCurrentTone(tone);
    setCurrentSpectrum(spectrum);
    saveSession(newSession);
    saveCurrentSessionId(newSession.id);
  }, []);

  const canUndo = session !== null && session.historyIndex >= 0;
  const canRedo = session !== null && session.historyIndex < session.operationHistory.length - 1;

  return {
    session,
    currentTone,
    currentSpectrum,
    scoreResult,
    feedback,
    isEvaluating,
    gameStatus,
    selectedWood,
    timeSpent,
    startSession,
    resumeSession,
    adjustField,
    undo,
    redo,
    canUndo,
    canRedo,
    resetAdjustments,
    evaluate,
    selectWood,
  };
}
