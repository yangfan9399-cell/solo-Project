import { For, Show, createSignal } from "solid-js";
import type { Defect, DefectType, SeverityLevel } from "../lib/types";
import { DEFECT_TYPE_LABELS, SEVERITY_LABELS } from "../lib/types";
import { defectTypeBadgeClass, severityBadgeClass, reviewStatusLabel, reviewStatusBadgeClass } from "../lib/utils";

interface Props {
  defect: Defect;
  onApprove?: (id: string) => void;
  onReject?: (id: string, comment: string) => void;
  showActions?: boolean;
}

export default function DefectAnnotation(props: Props) {
  const [rejectComment, setRejectComment] = createSignal("");
  const [showReject, setShowReject] = createSignal(false);

  return (
    <div class="card border-l-4" style={{ "border-left-color": props.defect.severity >= 3 ? "#ef4444" : "#f59e0b" }}>
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <span class={defectTypeBadgeClass(props.defect.type)}>{DEFECT_TYPE_LABELS[props.defect.type]}</span>
            <span class={severityBadgeClass(props.defect.severity)}>{SEVERITY_LABELS[props.defect.severity]}</span>
            <span class={reviewStatusBadgeClass(props.defect.reviewStatus)}>{reviewStatusLabel(props.defect.reviewStatus)}</span>
          </div>
          <p class="text-sm text-gray-800 mb-1">{props.defect.description}</p>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>里程: {props.defect.mileage}m</span>
            <span>位置: {props.defect.position}</span>
            {props.defect.length > 0 && <span>长: {props.defect.length}mm</span>}
            {props.defect.width > 0 && <span>宽: {props.defect.width}mm</span>}
            <span>标注: {props.defect.annotatedBy}</span>
          </div>
          <Show when={props.defect.reviewComment}>
            <div class="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
              <span class="font-medium">复核意见:</span> {props.defect.reviewComment}
            </div>
          </Show>
        </div>
        <Show when={props.showActions && props.defect.reviewStatus !== "approved"}>
          <div class="flex flex-col gap-2 flex-shrink-0">
            <Show when={props.onApprove}>
              <button class="btn-primary btn-sm" onClick={() => props.onApprove?.(props.defect.id)}>通过</button>
            </Show>
            <Show when={props.onReject}>
              <button class="btn-danger btn-sm" onClick={() => setShowReject(!showReject())}>退回</button>
            </Show>
          </div>
        </Show>
      </div>
      <Show when={showReject()}>
        <div class="mt-3 pt-3 border-t border-gray-200">
          <textarea
            class="input-field mb-2"
            rows={2}
            placeholder="请输入退回原因…"
            value={rejectComment()}
            onInput={(e) => setRejectComment(e.currentTarget.value)}
          />
          <div class="flex justify-end gap-2">
            <button class="btn-secondary btn-sm" onClick={() => setShowReject(false)}>取消</button>
            <button class="btn-danger btn-sm" onClick={() => {
              if (rejectComment().trim()) {
                props.onReject?.(props.defect.id, rejectComment());
                setShowReject(false);
                setRejectComment("");
              }
            }}>确认退回</button>
          </div>
        </div>
      </Show>
    </div>
  );
}
