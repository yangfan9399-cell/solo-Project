'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import WaveformView from './WaveformView';
import type { CleaningMethod, RepairHistory, TapeDetail } from '@/lib/types';

interface TapeData extends TapeDetail {
  sessionId: string;
}

interface Props {
  initialSession: {
    id: string;
    label: string;
    batchDescription: string;
    tapeCount: number;
    status: string;
    startedAt: number;
  };
  initialTapes: TapeData[];
  initialSeedHint?: string;
}

const CLEANING_METHODS: { id: CleaningMethod; name: string; cost: number; desc: string }[] = [
  { id: 'alcohol_swab', name: '酒精棉擦拭', cost: 5, desc: '轻度清洁，去除表层霉斑' },
  { id: 'compressed_air', name: '压缩空气吹扫', cost: 3, desc: '除尘，物理清洁灰尘颗粒' },
  { id: 'baking_method', name: '烘箱烘烤法', cost: 15, desc: '深度脱水，处理严重霉变' },
  { id: 'rewind_cycle', name: '正反复卷循环', cost: 2, desc: '松弛磁带张力，轻微走带不顺' },
];

const DEFECT_LABELS: Record<string, string> = {
  mold: '霉斑',
  breakage: '断裂',
  speed_drift: '转速漂移',
  noise: '底噪过大',
};

const ACTION_LABELS: Record<string, string> = {
  register_tape: '📦 登记磁带',
  select_cleaning: '🧹 清洁处理',
  splice_break: '🔗 断点拼接',
  adjust_speed: '⚙ 速度校正',
  apply_noise_reduction: '🔇 降噪处理',
  rollback: '↩ 状态回滚',
  recalculate: '🔄 结果重算',
  complete_repair: '✅ 完成修复',
};

export default function RepairWorkbench({ initialSession, initialTapes, initialSeedHint }: Props) {
  const router = useRouter();
  const [tapes, setTapes] = useState<TapeData[]>(initialTapes);
  const [currentTapeIdx, setCurrentTapeIdx] = useState(0);
  const [history, setHistory] = useState<RepairHistory[]>([]);
  const [selectedCleaning, setSelectedCleaning] = useState<CleaningMethod | null>(null);
  const [cleaningApplied, setCleaningApplied] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [speedValue, setSpeedValue] = useState(1);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tapeStartTimes, setTapeStartTimes] = useState<Record<string, number>>({});
  const [nrResult, setNrResult] = useState<{ detailLoss: number; isExcessive: boolean } | null>(null);
  const [spliceResult, setSpliceResult] = useState<{ isCorrect: boolean; position: number } | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const tapeStartTimeRef = useRef<number>(Date.now());

  const currentTape = tapes[currentTapeIdx];
  const session = initialSession;

  useEffect(() => {
    loadHistory();
    if (currentTape && !tapeStartTimes[currentTape.id]) {
      const now = Date.now();
      setTapeStartTimes((prev) => ({ ...prev, [currentTape.id]: now }));
      tapeStartTimeRef.current = now;
    }
  }, [currentTapeIdx]);

  async function loadHistory() {
    try {
      const res = await fetch(`/api/sessions/${session.id}/history`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (e) {
      console.error(e);
    }
  }

  function getTapeHistory() {
    return history.filter((h) => h.tapeDetailId === currentTape?.id || h.tapeDetailId === null);
  }

  async function applyCleaning() {
    if (!selectedCleaning || !currentTape) return;
    setError(null);
    try {
      const res = await fetch(`/api/tapes/${currentTape.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clean',
          sessionId: session.id,
          method: selectedCleaning,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateTape(data.tape);
      setCleaningApplied(true);
      setStatusMessage(`✅ 已应用清洁方案：${CLEANING_METHODS.find((m) => m.id === selectedCleaning)?.name}`);
      loadHistory();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  }

  async function handleWaveformClick(position: number) {
    if (!currentTape || currentTape.breakpoints.length === 0) return;
    setError(null);
    try {
      const res = await fetch(`/api/tapes/${currentTape.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'splice',
          sessionId: session.id,
          position,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateTape(data.tape);
      setSpliceResult({ isCorrect: data.isCorrect, position });
      setStatusMessage(
        data.isCorrect
          ? `✓ 拼接成功 @位置${position}（正确！断点匹配）`
          : `⚠ 拼接 @位置${position}（位置偏离，将产生跳音！）`
      );
      loadHistory();
      setTimeout(() => {
        setSpliceResult(null);
        setStatusMessage(null);
      }, 4000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  }

  async function handleSpeedChange(newSpeed: number) {
    if (!currentTape) return;
    setError(null);
    setSpeedValue(newSpeed);
    try {
      const res = await fetch(`/api/tapes/${currentTape.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'speed',
          sessionId: session.id,
          speed: newSpeed,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateTape(data.tape);
      const deviationMsg =
        data.deviation > 0.15 ? '（偏离过大，将产生失真！）' : '';
      setStatusMessage(`⚙ 速度设为 ${newSpeed.toFixed(2)}x ${deviationMsg}`);
      loadHistory();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  }

  async function handleNoiseChange(newLevel: number) {
    if (!currentTape) return;
    setError(null);
    setNoiseLevel(newLevel);
    try {
      const res = await fetch(`/api/tapes/${currentTape.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'noise_reduction',
          sessionId: session.id,
          level: newLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateTape(data.tape);
      setNrResult({ detailLoss: data.detailLoss, isExcessive: data.isExcessive });
      const msg = data.isExcessive
        ? `⚠ 降噪强度 ${newLevel.toFixed(2)} - 过度降噪！人声细节损失 ${(data.detailLoss * 100).toFixed(1)}%`
        : `🔇 降噪强度 ${newLevel.toFixed(2)} - 细节损失 ${(data.detailLoss * 100).toFixed(1)}%`;
      setStatusMessage(msg);
      loadHistory();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  }

  async function handleRollback(historyId: string) {
    if (!currentTape) return;
    setError(null);
    try {
      const res = await fetch(`/api/tapes/${currentTape.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rollback',
          sessionId: session.id,
          historyId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateTape(data.tape);
      const nr = data.tape.noiseReductionLevel;
      const sp = data.tape.appliedSpeed;
      setNoiseLevel(nr);
      setSpeedValue(sp);
      setStatusMessage(`↩ 已回滚 ${data.rolledBackActions} 步操作`);
      setNrResult(null);
      setSpliceResult(null);
      loadHistory();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  }

  async function handleRecalculate() {
    if (!currentTape) return;
    setError(null);
    try {
      const res = await fetch(`/api/tapes/${currentTape.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recalculate',
          sessionId: session.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateTape(data.tape);
      const metrics = (data.analysis ? null : null);
      setStatusMessage('🔄 已按当前参数重新计算波形');
      loadHistory();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  }

  async function handleCompleteTape() {
    if (!currentTape || !selectedCleaning) {
      setError('请先选择并应用清洁方案');
      return;
    }
    setError(null);
    try {
      const startTime = tapeStartTimes[currentTape.id] || tapeStartTimeRef.current;
      const repairTime = Date.now() - startTime;
      const res = await fetch(`/api/tapes/${currentTape.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          sessionId: session.id,
          cleaningMethod: selectedCleaning,
          repairTimeMs: repairTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadHistory();

      if (currentTapeIdx < tapes.length - 1) {
        setCurrentTapeIdx(currentTapeIdx + 1);
        setSelectedCleaning(null);
        setCleaningApplied(false);
        setNoiseLevel(0);
        setSpeedValue(1);
        setNrResult(null);
        setSpliceResult(null);
        setStatusMessage('✅ 磁带修复完成，进入下一盘');
        setTimeout(() => setStatusMessage(null), 2500);
      } else {
        try {
          const completeRes = await fetch(`/api/sessions/${session.id}`, {
            method: 'POST',
          });
          const completeData = await completeRes.json();
          if (!completeRes.ok) throw new Error(completeData.error);
          router.push(`/session/${session.id}/result`);
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : '结算失败');
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  }

  function updateTape(updated: TapeData) {
    setTapes((prev) =>
      prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
    );
  }

  function switchTape(idx: number) {
    if (idx === currentTapeIdx) return;
    setCurrentTapeIdx(idx);
    const tape = tapes[idx];
    setSelectedCleaning(null);
    setCleaningApplied(false);
    setNoiseLevel(tape.noiseReductionLevel);
    setSpeedValue(tape.appliedSpeed);
    setNrResult(null);
    setSpliceResult(null);
  }

  if (!currentTape) {
    return (
      <div className="text-center p-10 text-tape-muted">
      加载中...
      </div>
    );
  }

  const tapeHistory = getTapeHistory();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <header className="mb-6 flex flex-wrap justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
          <a href="/" className="text-tape-muted hover:text-tape-accent text-sm">← 返回首页</a>
          <span className="text-tape-muted">|</span>
          <span className="text-tape-accent text-sm">局次 {session.id.slice(0, 8)}...</span>
          </div>
          <h1 className="text-2xl font-bold text-tape-text">{session.label}</h1>
          <p className="text-tape-muted text-sm mt-1">{session.batchDescription}</p>
          {initialSeedHint && (
          <p className="text-tape-accent/80 text-xs mt-2 bg-tape-accent/10 px-3 py-2 rounded border border-tape-accent/30">
            💡 {initialSeedHint}
          </p>
          )}
        </div>
        <div className="flex gap-2">
          {tapes.map((t, i) => (
          <button
            key={t.id}
            onClick={() => switchTape(i)}
            className={`px-4 py-2 rounded text-sm font-mono transition-all ${
              i === currentTapeIdx
                ? 'bg-tape-accent text-black font-bold'
                : t.status === 'completed'
                ? 'bg-tape-success/20 text-tape-success border border-tape-success/30'
                : 'bg-tape-panel text-tape-muted border border-tape-border hover:border-tape-muted'
            }`}
          >
            {t.status === 'completed' ? '✓' : i === currentTapeIdx ? '▶' : '○'} 磁带{i + 1}
          </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="bg-tape-danger/20 border border-tape-danger text-tape-danger px-4 py-3 rounded mb-4">
        ⚠ {error}
        </div>
      )}
      {statusMessage && (
        <div className="bg-tape-accent/20 border border-tape-accent text-tape-accent px-4 py-3 rounded mb-4 animate-pulse">
        {statusMessage}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-tape-panel border border-tape-border rounded-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-tape-accent">
                📼 {currentTape.label}
              </h2>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={showOriginal}
                    onChange={(e) => setShowOriginal(e.target.checked)}
                    className="accent-tape-accent"
                  />
                  <span className="text-tape-muted">显示原始波形（对比）</span>
                </label>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {currentTape.defects.map((d) => (
                <span key={d} className="px-2 py-1 bg-tape-danger/20 text-tape-danger text-xs rounded">
                  {DEFECT_LABELS[d]}
                </span>
              ))}
              {currentTape.speedDrift !== 0 && (
                <span className="px-2 py-1 bg-orange-900/40 text-orange-300 text-xs rounded">
                  漂移率: {(currentTape.speedDrift > 0 ? '+' : '')}{(currentTape.speedDrift * 100).toFixed(1)}%
                </span>
              )}
              <span className="px-2 py-1 bg-tape-muted/20 text-tape-muted text-xs rounded">
                底噪水平: {(currentTape.noiseLevel * 100).toFixed(0)}%
              </span>
            </div>

            {showOriginal && (
              <div className="mb-4">
                <WaveformView
                  waveform={currentTape.originalWaveform}
                  width={780}
                  height={120}
                  label="原始无缺陷波形（参考）"
                />
              </div>
            )}

            <WaveformView
              waveform={currentTape.currentWaveform}
              width={780}
              height={200}
              showBreakpoints={currentTape.breakpoints}
              showSplices={currentTape.splices}
              onClickPosition={handleWaveformClick}
              label={`当前修复波形 - ${currentTape.splices.length}/${currentTape.breakpoints.length} 断点已处理`}
            />

            {currentTape.breakpoints.length > 0 && (
              <div className="mt-3 text-xs text-tape-muted">
                💡 点击波形上的断点位置（红色虚线附近）进行拼接。距离断点5个采样点内判定为正确拼接
              </div>
            )}

            {spliceResult && (
              <div className={`mt-3 p-3 rounded text-sm ${
                spliceResult.isCorrect ? 'bg-tape-success/15 border border-tape-success/40 text-tape-success' : 'bg-orange-900/30 border border-orange-500/40 text-orange-300'}`}>
                {spliceResult.isCorrect
                  ? `✓ 拼接判定：位置${spliceResult.position} - 正确匹配，波形平滑过渡`
                  : `⚠ 拼接判定：位置${spliceResult.position} - 位置偏移，产生跳音伪影！`}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-tape-panel border border-tape-border rounded-lg p-5">
              <h3 className="text-tape-accent font-bold mb-4">🧹 步骤 1：选择清洁方案</h3>
              <div className="space-y-2 mb-4">
                {CLEANING_METHODS.map((m) => (
                  <label
                    key={m.id}
                    className={`block p-3 rounded border cursor-pointer transition-all ${
                      selectedCleaning === m.id
                        ? 'border-tape-accent bg-tape-accent/10'
                        : 'border-tape-border hover:border-tape-muted bg-tape-bg'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="cleaning"
                        checked={selectedCleaning === m.id}
                        onChange={() => setSelectedCleaning(m.id)}
                        disabled={cleaningApplied}
                        className="accent-tape-accent"
                      />
                      <div className="flex-1">
                        <div className="text-tape-text text-sm font-bold">
                          {m.name}
                          <span className="text-tape-muted font-normal ml-2">¥{m.cost}</span>
                        </div>
                        <div className="text-tape-muted text-xs mt-0.5">{m.desc}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <button
                onClick={applyCleaning}
                disabled={!selectedCleaning || cleaningApplied}
                className={`w-full py-2 rounded font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                  cleaningApplied
                    ? 'bg-tape-success/30 text-tape-success border border-tape-success/50'
                    : 'bg-tape-accent text-black hover:bg-yellow-400'
                }`}
              >
                {cleaningApplied ? '✓ 已应用清洁' : '▶ 执行清洁'}
              </button>
            </div>

            <div className="bg-tape-panel border border-tape-border rounded-lg p-5 space-y-6">
              <div>
                <h3 className="text-tape-accent font-bold mb-3">⚙ 步骤 2：播放速度校正</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-tape-text">
                    速度倍率
                  </span>
                  <span className={`font-mono text-lg ${
                    Math.abs(1 - speedValue) > 0.15 ? 'text-tape-danger' : 'text-tape-accent'
                  }`}>
                    {speedValue.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.7}
                  max={1.3}
                  step={0.01}
                  value={speedValue}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                  className="w-full accent-tape-accent"
                />
                <div className="flex justify-between text-[10px] text-tape-muted mt-1">
                  <span>0.7x 慢速</span>
                  <span className="text-tape-accent">1.0x 标准</span>
                  <span>1.3x 快速</span>
                </div>
                <div className="mt-2 text-xs text-tape-muted">
                  磁带漂移率：<span className="text-orange-300">{(currentTape.speedDrift > 0 ? '+' : '')}{(currentTape.speedDrift * 100).toFixed(1)}%</span>
                  {Math.abs(currentTape.speedDrift) > 0.01 && (
                    <span className="ml-2">
                      建议校正至约 {(1 / (1 + currentTape.speedDrift)).toFixed(2)}x
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-tape-border">
                <h3 className="text-tape-accent font-bold mb-3">🔇 步骤 3：降噪强度</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-tape-text">降噪等级</span>
                  <span className={`font-mono text-lg ${
                    noiseLevel > 0.7 ? 'text-tape-danger' : 'text-tape-accent'
                  }`}>
                    {(noiseLevel * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={noiseLevel}
                  onChange={(e) => handleNoiseChange(parseFloat(e.target.value))}
                  className="w-full accent-tape-accent"
                />
                <div className="flex justify-between text-[10px] text-tape-muted mt-1">
                  <span>0% 保留原声</span>
                  <span className="text-tape-danger">70%+ 过度降噪⚠</span>
                  <span>100% 极限</span>
                </div>
                {nrResult && (
                  <div className={`mt-2 p-2 rounded text-xs ${
                    nrResult.isExcessive ? 'bg-tape-danger/15 border border-tape-danger/40 text-tape-danger' : 'bg-tape-success/15 text-tape-success'
                  }`}>
                    {nrResult.isExcessive
                      ? `⚠ 过度降噪！人声细节损失：{(nrResult.detailLoss * 100).toFixed(1)}% - 将严重影响可懂度！`
                      : `细节损失：{(nrResult.detailLoss * 100).toFixed(1)}% - 在可接受范围内`}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-tape-panel border border-tape-border rounded-lg p-5">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="flex gap-2">
                <button
                  onClick={handleRecalculate}
                  className="px-4 py-2 bg-tape-muted/30 text-tape-text rounded hover:bg-tape-muted/50 text-sm border border-tape-border"
                >
                  🔄 重新计算波形
                </button>
              </div>
              <button
                onClick={handleCompleteTape}
                className="px-8 py-3 bg-tape-success text-black font-bold rounded hover:bg-green-400"
              >
                ✓ 完成本磁带修复 →
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="bg-tape-panel border border-tape-border rounded-lg p-4">
            <h3 className="text-tape-accent font-bold mb-3 text-sm">📊 实时状态</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-tape-muted">磁带状态</span>
                <span className={`font-bold ${
                  currentTape.status === 'completed' ? 'text-tape-success' :
                  currentTape.status === 'in_progress' ? 'text-tape-accent' : 'text-tape-muted'
                }`}>
                  {currentTape.status === 'completed' ? '已完成' :
                   currentTape.status === 'in_progress' ? '修复中' : '待处理'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tape-muted">断点处理</span>
                <span className="text-tape-text">
                  {currentTape.splices.length}/{currentTape.breakpoints.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tape-muted">拼接正确</span>
                <span className="text-tape-success">
                  {currentTape.splices.filter(s => s.isCorrect).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tape-muted">拼接错位</span>
                <span className="text-orange-400">
                  {currentTape.splices.filter(s => !s.isCorrect).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tape-muted">速度设置</span>
                <span className={`${
                  Math.abs(1 - currentTape.appliedSpeed) > 0.15 ? 'text-tape-danger' : 'text-tape-text'
                }`}>
                  {currentTape.appliedSpeed.toFixed(2)}x
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tape-muted">降噪等级</span>
                <span className={`${
                  currentTape.noiseReductionLevel > 0.6 ? 'text-tape-danger' : 'text-tape-text'
                }`}>
                  {(currentTape.noiseReductionLevel * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tape-muted">当前耗时</span>
                <span className="text-tape-text font-mono">
                  {formatDuration(Date.now() - (tapeStartTimes[currentTape.id] || tapeStartTimeRef.current))}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-tape-panel border border-tape-border rounded-lg p-4 max-h-[500px] overflow-y-auto">
            <h3 className="text-tape-accent font-bold mb-3 text-sm sticky top-0 bg-tape-panel pb-2">
              📜 操作历史
            </h3>
            {tapeHistory.length === 0 ? (
              <div className="text-tape-muted text-xs text-center py-4">暂无操作记录</div>
            ) : (
              <div className="space-y-2">
                {tapeHistory.slice().reverse().map((h, idx) => {
                  const realIdx = tapeHistory.length - 1 - idx;
                  return (
                    <div
                      key={h.id}
                      className="p-2 bg-tape-bg rounded border border-tape-border text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-tape-text font-mono">
                          #{h.sequenceNumber + 1}
                        </span>
                        <button
                          onClick={() => handleRollback(h.id)}
                          disabled={h.actionType === 'register_tape' || h.actionType === 'complete_repair'}
                          className="text-[10px] text-tape-muted hover:text-tape-danger px-1.5 py-0.5 border border-tape-border rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="回滚到此状态"
                        >
                          ↩回滚
                        </button>
                      </div>
                      <div className="text-tape-accent mt-1">
                        {ACTION_LABELS[h.actionType] || h.actionType}
                      </div>
                      <div className="text-tape-muted text-[10px] mt-1">
                        {new Date(h.timestamp).toLocaleTimeString('zh-CN')}
                      </div>
                      {h.actionData && Object.keys(h.actionData).length > 0 && (
                        <pre className="text-[10px] text-tape-muted/80 mt-1 whitespace-pre-wrap break-all">
                          {JSON.stringify(h.actionData, null, 0).slice(0, 120)}
                          {JSON.stringify(h.actionData).length > 120 ? '...' : ''}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
