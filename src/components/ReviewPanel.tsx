import { For, Show, createSignal } from "solid-js";
import type { ReviewBatch, Defect } from "../lib/types";
import { storage } from "../lib/storage";
import { REVIEW_STATUS_LABELS } from "../lib/types";
import { reviewStatusLabel, reviewStatusBadgeClass, formatDateTime } from "../lib/utils";

interface Props {
  reviews: ReviewBatch[];
  onApproveDefect?: (defectId: string) => void;
  onRejectDefect?: (defectId: string, comment: string) => void;
}

export default function ReviewPanel(props: Props) {
  const [expanded, setExpanded] = createSignal<string | null>(null);

  const getDefects = (ids: string[]): Defect[] => {
    return ids.map((id) => storage.defects.getById(id)).filter(Boolean) as Defect[];
  };

  return (
    <div class="space-y-3">
      <For each={props.reviews}>
        {(review) => {
          const defects = () => getDefects(review.defectIds);
          const isExpanded = () => expanded() === review.id;

          return (
            <div class="card">
              <div class="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(isExpanded() ? null : review.id)}>
                <div class="flex items-center gap-3">
                  <span class="font-medium text-sm">{review.batchName}</span>
                  <span class={reviewStatusBadgeClass(review.status)}>{reviewStatusLabel(review.status)}</span>
                  <span class="text-xs text-gray-500">复核人: {review.reviewer}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400">{defects().length} 项</span>
                  <svg class={`w-4 h-4 text-gray-400 transition-transform ${isExpanded() ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <Show when={review.comment}>
                <p class="mt-2 text-xs text-gray-500">{review.comment}</p>
              </Show>
              <Show when={isExpanded()}>
                <div class="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <For each={defects()}>
                    {(d) => (
                      <div class="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded">
                        <span class={reviewStatusBadgeClass(d.reviewStatus)}>{reviewStatusLabel(d.reviewStatus)}</span>
                        <span class="text-gray-700">{d.description.slice(0, 40)}…</span>
                        <span class="text-gray-400">里程 {d.mileage}m</span>
                        <Show when={props.onApproveDefect && d.reviewStatus !== "approved"}>
                          <button class="btn-primary btn-sm ml-auto" onClick={(e) => { e.stopPropagation(); props.onApproveDefect?.(d.id); }}>通过</button>
                        </Show>
                        <Show when={props.onRejectDefect && d.reviewStatus !== "approved"}>
                          <button class="btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); props.onRejectDefect?.(d.id, "请补充信息"); }}>退回</button>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
              <div class="mt-2 text-xs text-gray-400">
                创建: {formatDateTime(review.createdAt)}
                <Show when={review.completedAt}> · 完成: {formatDateTime(review.completedAt)}</Show>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
