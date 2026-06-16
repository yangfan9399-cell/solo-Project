"use client";

import { useState, useEffect, useCallback } from "react";
import { useBridgeEditor } from "@/hooks/useBridgeEditor";
import { BridgeCanvas } from "@/components/BridgeCanvas";
import { Toolbar } from "@/components/Toolbar";
import { MaterialBudget } from "@/components/MaterialBudget";
import { ResultModal } from "@/components/ResultModal";
import type { Level, FoldType, PhysicsResult, Point } from "@/types/game";
import { simulateBridge, calculateScore, validateBridgeDesign } from "@/lib/physics";

interface GamePageProps {
  level: Level;
  sessionId: string;
  onBack: () => void;
}

export function GamePage({ level, sessionId, onBack }: GamePageProps) {
  const {
    bridge,
    selectedSegmentId,
    setSelectedSegmentId,
    addSegment,
    removeSegment,
    moveSegment,
    changeFoldType,
    undo,
    redo,
    canUndo,
    canRedo,
    resetBridge,
  } = useBridgeEditor();

  const [foldType, setFoldType] = useState<FoldType>("flat");
  const [mode, setMode] = useState<"add" | "select" | "move">("add");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationWeight, setSimulationWeight] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<PhysicsResult | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [serverValidated, setServerValidated] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  useEffect(() => {
    const validation = validateBridgeDesign(bridge.segments, level);
    setValidationErrors(validation.errors);
    setValidationWarnings(validation.warnings);
  }, [bridge.segments, level]);

  const handleTest = useCallback(async () => {
    if (bridge.segments.length === 0) return;

    setIsSimulating(true);
    setSimulationWeight(0);

    const physicsResult = simulateBridge(bridge.segments, level);
    const score = calculateScore(
      physicsResult.maxWeight,
      bridge.totalPaperLength,
      level
    );

    const targetWeight = physicsResult.success
      ? level.targetWeight
      : physicsResult.maxWeight;

    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 2);

      setSimulationWeight(targetWeight * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          setResult(physicsResult);
          setFinalScore(score);
          setShowResult(true);
          setIsSimulating(false);

          validateScoreServer(physicsResult, score);
        }, 300);
      }
    };

    requestAnimationFrame(animate);
  }, [bridge, level]);

  const validateScoreServer = async (
    physicsResult: PhysicsResult,
    clientScore: number
  ) => {
    try {
      const res = await fetch("/api/validate-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          bridge,
          clientScore,
          clientMaxWeight: physicsResult.maxWeight,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFinalScore(data.serverScore);
        setServerValidated(true);

        if (data.breakPoint) {
          setResult((prev) =>
            prev
              ? {
                  ...prev,
                  breakPoint: data.breakPoint as Point,
                  breakSegmentId: data.breakSegmentId,
                }
              : null
          );
        }
      }
    } catch (e) {
      console.error("Score validation failed:", e);
    }
  };

  const handleShare = async () => {
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (res.ok) {
        const data = await res.json();
        const shareUrl = `${window.location.origin}/share/${data.shareId}`;
        await navigator.clipboard.writeText(shareUrl);
        alert("分享链接已复制到剪贴板！");
      }
    } catch (e) {
      alert("分享失败，请稍后再试");
    }
  };

  const handleRetry = () => {
    setShowResult(false);
    setResult(null);
    setSimulationWeight(0);
    setServerValidated(false);
    resetBridge();
  };

  const canTest =
    bridge.segments.length > 0 &&
    validationErrors.length === 0 &&
    bridge.totalPaperLength <= level.maxPaperLength;

  const stressMap = result?.stressMap || [];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="px-4 py-2 text-amber-700 hover:text-amber-900 transition-colors"
          >
            ← 返回关卡选择
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-amber-900">
              关卡 {level.id}: {level.name}
            </h1>
            <p className="text-sm text-amber-600">{level.description}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-amber-700">
              目标: {level.targetWeight}g
            </div>
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="text-red-700 font-medium text-sm mb-1">
              ⚠️ 设计问题：
            </div>
            <ul className="text-red-600 text-sm list-disc list-inside">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {validationWarnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="text-amber-700 font-medium text-sm mb-1">
              💡 提示：
            </div>
            <ul className="text-amber-600 text-sm list-disc list-inside">
              {validationWarnings.map((warn, idx) => (
                <li key={idx}>{warn}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-4 flex-col lg:flex-row">
          <div className="flex-1">
            <BridgeCanvas
              segments={bridge.segments}
              selectedSegmentId={selectedSegmentId}
              onSelectSegment={setSelectedSegmentId}
              onAddSegment={addSegment}
              onMoveSegment={moveSegment}
              level={level}
              foldType={foldType}
              mode={mode}
              isSimulating={isSimulating || showResult}
              breakPoint={result?.breakPoint || null}
              breakSegmentId={result?.breakSegmentId || null}
              weightOnBridge={simulationWeight}
              stressMap={stressMap}
              maxStressThreshold={level.paperStrength * 1000}
            />

            {selectedSegmentId && mode === "select" && (
              <div className="mt-3 bg-white/80 rounded-lg p-3 border border-amber-200">
                <h4 className="text-sm font-semibold text-amber-900 mb-2">
                  修改选中构件的折法
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {(["flat", "valley", "mountain", "tube", "triangle"] as FoldType[]).map(
                    (ft) => (
                      <button
                        key={ft}
                        onClick={() => changeFoldType(selectedSegmentId, ft)}
                        className={`px-3 py-1.5 text-sm rounded transition-colors ${
                          bridge.segments.find((s) => s.id === selectedSegmentId)
                            ?.foldType === ft
                            ? "bg-amber-500 text-white"
                            : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        }`}
                      >
                        {ft === "flat"
                          ? "平折"
                          : ft === "valley"
                          ? "谷折"
                          : ft === "mountain"
                          ? "山折"
                          : ft === "tube"
                          ? "筒状"
                          : "三角"}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-64 space-y-4">
            <Toolbar
              foldType={foldType}
              onFoldTypeChange={setFoldType}
              mode={mode}
              onModeChange={setMode}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              onDelete={() => selectedSegmentId && removeSegment(selectedSegmentId)}
              onReset={resetBridge}
              onTest={handleTest}
              isSimulating={isSimulating}
              hasSelection={!!selectedSegmentId}
              canTest={canTest}
            />

            <MaterialBudget
              used={bridge.totalPaperLength}
              total={level.maxPaperLength}
              segmentCount={bridge.segments.length}
            />

            <div className="bg-white/80 backdrop-blur rounded-lg border border-amber-200 p-3 shadow-sm">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">
                📖 折法说明
              </h3>
              <div className="text-xs text-amber-700 space-y-1.5">
                <p>
                  <strong>平折</strong>：基础结构，强度较弱
                </p>
                <p>
                  <strong>谷折/山折</strong>：V形折叠，增强1.3-1.4倍
                </p>
                <p>
                  <strong>三角</strong>：三角截面，强度约2倍
                </p>
                <p>
                  <strong>筒状</strong>：卷成圆筒，最强约2.2倍
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ResultModal
        isOpen={showResult}
        success={result?.success || false}
        maxWeight={result?.maxWeight || 0}
        targetWeight={level.targetWeight}
        score={finalScore}
        paperUsed={bridge.totalPaperLength}
        onClose={() => setShowResult(false)}
        onRetry={handleRetry}
        onShare={handleShare}
        onBackToLevels={onBack}
        serverValidated={serverValidated}
      />
    </div>
  );
}
