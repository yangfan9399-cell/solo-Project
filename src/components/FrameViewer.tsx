import { For, Show, createSignal } from "solid-js";
import type { InspectionFrame, Defect } from "../lib/types";
import { storage } from "../lib/storage";
import { DEFECT_TYPE_LABELS } from "../lib/types";

interface Props {
  frames: InspectionFrame[];
  defects: Defect[];
  currentFrameId: string | null;
  onSelectFrame: (id: string) => void;
}

export default function FrameViewer(props: Props) {
  const currentFrame = () => props.frames.find((f) => f.id === props.currentFrameId);
  const currentDefects = () => props.currentFrameId ? props.defects.filter((d) => d.frameId === props.currentFrameId) : [];
  const frameIndex = () => {
    const idx = props.frames.findIndex((f) => f.id === props.currentFrameId);
    return idx >= 0 ? idx : 0;
  };

  const prevFrame = () => {
    const idx = frameIndex();
    if (idx > 0) props.onSelectFrame(props.frames[idx - 1].id);
  };

  const nextFrame = () => {
    const idx = frameIndex();
    if (idx < props.frames.length - 1) props.onSelectFrame(props.frames[idx + 1].id);
  };

  return (
    <div class="flex gap-4 h-full">
      <div class="w-48 flex-shrink-0 border border-gray-200 rounded-lg overflow-y-auto max-h-[500px]">
        <div class="p-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 sticky top-0">帧列表</div>
        <For each={props.frames}>
          {(f) => {
            const hasDefect = () => props.defects.some((d) => d.frameId === f.id);
            const isActive = () => f.id === props.currentFrameId;
            return (
              <div
                class={`px-3 py-2 text-xs cursor-pointer border-b border-gray-100 ${isActive() ? "bg-primary-50 text-primary-700 font-medium" : "hover:bg-gray-50"} ${hasDefect() ? "border-l-2 border-l-red-400" : ""}`}
                onClick={() => props.onSelectFrame(f.id)}
              >
                <div class="font-mono">#{f.frameIndex}</div>
                <div class="text-gray-400">{f.mileage}m</div>
              </div>
            );
          }}
        </For>
      </div>
      <div class="flex-1 flex flex-col">
        <Show when={currentFrame()} fallback={
          <div class="flex-1 flex items-center justify-center text-gray-400 border border-gray-200 rounded-lg">
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p class="text-sm">选择左侧帧查看</p>
            </div>
          </div>
        }>
          {(frame) => (
            <>
              <div class="flex-1 bg-gray-800 rounded-lg flex items-center justify-center relative min-h-[300px]">
                <div class="text-center text-gray-400">
                  <svg class="w-16 h-16 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  <p class="text-xs">帧 #{frame().frameIndex} · 里程 {frame().mileage}m</p>
                  <p class="text-xs mt-1">{frame().description}</p>
                </div>
                <div class="absolute top-2 right-2 text-xs text-gray-500 bg-gray-900/50 px-2 py-1 rounded">
                  {frame().timestamp}
                </div>
                <For each={currentDefects()}>
                  {(d) => (
                    <div
                      class="absolute border-2 border-red-500 bg-red-500/10 rounded cursor-pointer"
                      style={{ top: "30%", left: "35%", width: "80px", height: "50px" }}
                      title={`${DEFECT_TYPE_LABELS[d.type]} - ${d.description}`}
                    >
                      <span class="absolute -top-4 left-0 text-[10px] bg-red-500 text-white px-1 rounded">{DEFECT_TYPE_LABELS[d.type]}</span>
                    </div>
                  )}
                </For>
              </div>
              <div class="flex items-center justify-between mt-2">
                <button class="btn-secondary btn-sm" onClick={prevFrame} disabled={frameIndex() === 0}>← 上一帧</button>
                <span class="text-xs text-gray-400">{frameIndex() + 1} / {props.frames.length}</span>
                <button class="btn-secondary btn-sm" onClick={nextFrame} disabled={frameIndex() === props.frames.length - 1}>下一帧 →</button>
              </div>
            </>
          )}
        </Show>
      </div>
    </div>
  );
}
