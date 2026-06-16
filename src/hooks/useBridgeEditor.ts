"use client";

import { useState, useCallback, useRef } from "react";
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

function cloneBridge(bridge: Bridge): Bridge {
  return JSON.parse(JSON.stringify(bridge));
}

export function useBridgeEditor(initialBridge?: Bridge) {
  const [bridge, setBridge] = useState<Bridge>(() => initialBridge || createEmptyBridge());
  const [history, setHistory] = useState<Bridge[]>(() => [
    initialBridge ? cloneBridge(initialBridge) : createEmptyBridge(),
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const isUndoingRedoing = useRef(false);

  const pushHistory = useCallback((newBridge: Bridge) => {
    if (isUndoingRedoing.current) {
      isUndoingRedoing.current = false;
      return;
    }

    setHistory((prev) => {
      const truncated = prev.slice(0, historyIndex + 1);
      truncated.push(cloneBridge(newBridge));
      return truncated;
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    const prevIndex = historyIndex - 1;
    const prevBridge = history[prevIndex];

    isUndoingRedoing.current = true;
    setBridge(cloneBridge(prevBridge));
    setHistoryIndex(prevIndex);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    const nextIndex = historyIndex + 1;
    const nextBridge = history[nextIndex];

    isUndoingRedoing.current = true;
    setBridge(cloneBridge(nextBridge));
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

      const newBridge: Bridge = {
        ...bridge,
        segments: [...bridge.segments, newSegment],
        totalPaperLength: bridge.totalPaperLength + length,
      };

      setBridge(newBridge);
      pushHistory(newBridge);
      return newSegment;
    },
    [bridge, pushHistory]
  );

  const removeSegment = useCallback(
    (segmentId: string) => {
      const segment = bridge.segments.find((s) => s.id === segmentId);
      if (!segment) return;

      const newBridge: Bridge = {
        ...bridge,
        segments: bridge.segments.filter((s) => s.id !== segmentId),
        totalPaperLength: bridge.totalPaperLength - segment.length,
      };

      setBridge(newBridge);
      pushHistory(newBridge);

      if (selectedSegmentId === segmentId) {
        setSelectedSegmentId(null);
      }
    },
    [bridge, selectedSegmentId, pushHistory]
  );

  const moveSegment = useCallback(
    (segmentId: string, newStart: Point, newEnd: Point) => {
      const newLength = distance(newStart, newEnd);
      const oldSegment = bridge.segments.find((s) => s.id === segmentId);
      if (!oldSegment) return;

      const lengthDiff = newLength - oldSegment.length;

      const newBridge: Bridge = {
        ...bridge,
        segments: bridge.segments.map((s) =>
          s.id === segmentId
            ? { ...s, start: newStart, end: newEnd, length: newLength }
            : s
        ),
        totalPaperLength: bridge.totalPaperLength + lengthDiff,
      };

      setBridge(newBridge);
      pushHistory(newBridge);
    },
    [bridge, pushHistory]
  );

  const changeFoldType = useCallback(
    (segmentId: string, foldType: FoldType) => {
      const newBridge: Bridge = {
        ...bridge,
        segments: bridge.segments.map((s) =>
          s.id === segmentId ? { ...s, foldType } : s
        ),
      };

      setBridge(newBridge);
      pushHistory(newBridge);
    },
    [bridge, pushHistory]
  );

  const setBridgeName = useCallback(
    (name: string) => {
      const newBridge = { ...bridge, name };
      setBridge(newBridge);
      pushHistory(newBridge);
    },
    [bridge, pushHistory]
  );

  const resetBridge = useCallback(() => {
    const empty = createEmptyBridge();
    setBridge(empty);
    setHistory([empty]);
    setHistoryIndex(0);
    setSelectedSegmentId(null);
  }, []);

  const loadBridge = useCallback((loadedBridge: Bridge) => {
    const clone = cloneBridge(loadedBridge);
    setBridge(clone);
    setHistory([clone]);
    setHistoryIndex(0);
    setSelectedSegmentId(null);
  }, []);

  const canUndo = historyIndex > 0;
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
