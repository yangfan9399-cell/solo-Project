import { A } from "@solidjs/router";
import { createAsync, useAction } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import EmptyState from "~/components/EmptyState";
import { getExceptionsAction, resolveExceptionAction, getILLRequestAction } from "~/server/actions";
import type { ExceptionRecord } from "~/server/db";

const typeLabels: Record<string, string> = {
  damage: "图书损坏",
  lost: "图书丢失",
  delay: "物流延迟",
  other: "其他"
};

const statusLabels: Record<string, { label: string; class: string }> = {
  open: { label: "待处理", class: "bg-red-100 text-red-800" },
  processing: { label: "处理中", class: "bg-yellow-100 text-yellow-800" },
  resolved: { label: "已解决", class: "bg-green-100 text-green-800" }
};

export default function Exceptions() {
  const [trigger, setTrigger] = createSignal(0);
  const [filter, setFilter] = createSignal<"all" | "open" | "processing" | "resolved">("all");
  const [showResolveModal, setShowResolveModal] = createSignal(false);
  const [selectedException, setSelectedException] = createSignal<number | null>(null);

  const exceptions = createAsync(() => {
    trigger();
    return getExceptionsAction(filter() === "all" ? undefined : filter());
  });
  const resolveAction = useAction(resolveExceptionAction);

  const getRequestInfo = (requestId: number) => {
    return createAsync(() => getILLRequestAction(requestId))();
  };

  const handleResolve = () => {
    if (!selectedException()) return;
    const formData = new FormData();
    formData.append("exception_id", String(selectedException()!));
    formData.append("resolution", (document.getElementById("resolution-text") as HTMLTextAreaElement)?.value || "");
    resolveAction(formData);
    setShowResolveModal(false);
    setSelectedException(null);
    setTrigger(t => t + 1);
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">异常反馈</h1>
          <p class="text-gray-500">处理馆际互借过程中的异常情况</p>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="flex gap-2">
            <button
              onClick={() => { setFilter("all"); setTrigger(t => t + 1); }}
              class={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter() === "all"
                  ? "bg-primary-100 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => { setFilter("open"); setTrigger(t => t + 1); }}
              class={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter() === "open"
                  ? "bg-red-100 text-red-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              待处理
            </button>
            <button
              onClick={() => { setFilter("processing"); setTrigger(t => t + 1); }}
              class={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter() === "processing"
                  ? "bg-yellow-100 text-yellow-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              处理中
            </button>
            <button
              onClick={() => { setFilter("resolved"); setTrigger(t => t + 1); }}
              class={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter() === "resolved"
                  ? "bg-green-100 text-green-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              已解决
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        {(!exceptions() || exceptions()?.length === 0) ? (
          <EmptyState 
            icon="✅" 
            title="暂无异常记录" 
            description="当前没有待处理的异常情况"
          />
        ) : (
          <For each={exceptions()}>
            {(exception: ExceptionRecord) => {
              const request = getRequestInfo(exception.ill_request_id);
              const statusConfig = statusLabels[exception.status];
              return (
                <div class="card">
                  <div class="card-body">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <span class={`badge ${statusConfig.class}`}>
                            {statusConfig.label}
                          </span>
                          <span class="badge bg-gray-100 text-gray-600">
                            {typeLabels[exception.type] || exception.type}
                          </span>
                          <span class="text-sm text-gray-500">
                            上报时间：{exception.reported_at}
                          </span>
                        </div>
                        <Show when={request}>
                          {(req) => (
                            <A 
                              href={`/requests/${req().id}`}
                              class="text-lg font-semibold text-gray-900 hover:text-primary-600"
                            >
                              {req().book_title}
                            </A>
                          )}
                        </Show>
                        <div class="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                          <p class="text-sm text-red-800">
                            <span class="font-medium">异常描述：</span>
                            {exception.description}
                          </p>
                          <p class="text-sm text-red-600 mt-1">
                            上报人：{exception.reported_by}
                          </p>
                        </div>
                        <Show when={exception.resolution}>
                          <div class="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                            <p class="text-sm text-green-800">
                              <span class="font-medium">解决方案：</span>
                              {exception.resolution}
                            </p>
                            <p class="text-sm text-green-600 mt-1">
                              解决时间：{exception.resolved_at}
                            </p>
                          </div>
                        </Show>
                      </div>
                      <Show when={exception.status !== "resolved"}>
                        <button
                          onClick={() => {
                            setSelectedException(exception.id);
                            setShowResolveModal(true);
                          }}
                          class="btn-primary text-sm"
                        >
                          处理
                        </button>
                      </Show>
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        )}
      </div>

      <Show when={showResolveModal()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl max-w-md w-full">
            <div class="p-6 border-b border-gray-200">
              <h3 class="text-lg font-semibold">处理异常</h3>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">解决方案</label>
                <textarea 
                  id="resolution-text" 
                  class="textarea" 
                  rows={4} 
                  placeholder="请输入解决方案..."
                />
              </div>
              <div class="flex justify-end gap-3">
                <button onClick={() => setShowResolveModal(false)} class="btn-secondary">
                  取消
                </button>
                <button onClick={handleResolve} class="btn-primary">
                  标记已解决
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
