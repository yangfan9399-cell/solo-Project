"use client";

import { useState, useCallback } from "react";
import type { Bridge, PaperSegment, Operation, FoldType, Point } from "@/types/game";
import { v4 as uuidv4 } from "uuid";

function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function createEmptyBridge(): Bridge {
  return {
    id: uuidv4(),
    name: "我的纸桥",
    segments: [],
    totalPaperLength: 0,
    createdAt: Date.now(),
  };
}

export function useBridgeEditor(initialBridge?: Bridge) {
  const [bridge, setBridge] = useState<Bridge>(() => initialBridge || createEmptyBridge());
  const [history, setHistory] = useState<Operation[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  const saveSnapshot = useCallback(
    (type: Operation["type"], data: Record<string, unknown>) => {
      const newOp: Operation = {
        id: uuidv4(),
        type,
        timestamp: Date.now(),
        data,
        snapshot: JSON.parse(JSON.stringify(bridge)),
      };

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newOp);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [bridge, history, historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex < 0) return;

    const op = history[historyIndex];
    setBridge(op.snapshot);
    setHistoryIndex(historyIndex - 1);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    const nextIndex = historyIndex + 1;
    const nextOp = history[nextIndex];

    setBridge(nextOp.snapshot);
    setHistoryIndex(nextIndex);
  }, [history, historyIndex]);

  const addSegment = useCallback(
    (start: Point, end: Point, foldType: FoldType = "flat") => {
      const length = distance(start, end);
      const newSegment: PaperSegment = {
        id: uuidv4(),
        start,
        end,
        foldType,
        thickness: 0.1,
        width: 21,
        strength: 15,
        length,
      };

      setBridge((prev) => ({
        ...prev,
        segments: [...prev.segments, newSegment],
        totalPaperLength: prev.totalPaperLength + length,
      }));

      saveSnapshot("add_segment", { segmentId: newSegment.id });
      return newSegment;
    },
    [saveSnapshot]
  );

  const removeSegment = useCallback(
    (segmentId: string) => {
      const segment = bridge.segments.find((s) => s.id === segmentId);
      if (!segment) return;

      setBridge((prev) => ({
        ...prev,
        segments: prev.segments.filter((s) => s.id !== segmentId),
        totalPaperLength: prev.totalPaperLength - segment.length,
      }));

      if (selectedSegmentId === segmentId) {
        setSelectedSegmentId(null);
      }

      saveSnapshot("remove_segment", { segmentId });
    },
    [bridge.segments, selectedSegmentId, saveSnapshot]
  );

  const moveSegment = useCallback(
    (segmentId: string, newStart: Point, newEnd: Point) => {
      const newLength = distance(newStart, newEnd);

      setBridge((prev) => {
        const oldSegment = prev.segments.find((s) => s.id === segmentId);
        if (!oldSegment) return prev;

        const lengthDiff = newLength - oldSegment.length;

        return {
          ...prev,
          segments: prev.segments.map((s) =>
            s.id === segmentId
              ? { ...s, start: newStart, end: newEnd, length: newLength }
              : s
          ),
          totalPaperLength: prev.totalPaperLength + lengthDiff,
        };
      });

      saveSnapshot("move_segment", { segmentId });
    },
    [saveSnapshot]
  );

  const changeFoldType = useCallback(
    (segmentId: string, foldType: FoldType) => {
      setBridge((prev) => ({
        ...prev,
        segments: prev.segments.map((s) =>
          s.id === segmentId ? { ...s, foldType } : s
        ),
      }));

      saveSnapshot("change_fold", { segmentId, foldType });
    },
    [saveSnapshot]
  );

  const setBridgeName = useCallback(
    (name: string) => {
      setBridge((prev) => ({ ...prev, name }));
      saveSnapshot("set_bridge_name", { name });
    },
    [saveSnapshot]
  );

  const resetBridge = useCallback(() => {
    const empty = createEmptyBridge();
    setBridge(empty);
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedSegmentId(null);
  }, []);

  const loadBridge = useCallback((loadedBridge: Bridge) => {
    setBridge(loadedBridge);
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedSegmentId(null);
  }, []);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    bridge,
    selectedSegmentId,
    setSelectedSegmentId,
    addSegment,
    removeSegment,
    moveSegment,
    changeFoldType,
    setBridgeName,
    undo,
    redo,
    canUndo,
    canRedo,
    resetBridge,
    loadBridge,
    history,
    historyIndex,
  };
}
