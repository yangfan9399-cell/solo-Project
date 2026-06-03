import { A } from "@solidjs/router";
import { createAsync, useAction } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import StatusBadge from "~/components/StatusBadge";
import EmptyState from "~/components/EmptyState";
import {
  getRenewalRequestsAction,
  getILLRequestAction,
  approveRenewalAction,
  rejectRenewalAction
} from "~/server/actions";
import type { RenewalRequest } from "~/server/db";

export default function Renewals() {
  const renewals = createAsync(() => getRenewalRequestsAction());
  const [filter, setFilter] = createSignal<"all" | "pending" | "approved" | "rejected">("all");
  const [showRejectModal, setShowRejectModal] = createSignal(false);
  const [selectedRenewal, setSelectedRenewal] = createSignal<number | null>(null);

  const approveAction = useAction(approveRenewalAction);
  const rejectAction = useAction(rejectRenewalAction);

  const filteredRenewals = () => {
    if (!renewals()) return [];
    if (filter() === "all") return renewals();
    return renewals()?.filter((r: RenewalRequest) => r.status === filter());
  };

  const getRequestInfo = (requestId: number) => {
    return createAsync(() => getILLRequestAction(requestId))();
  };

  const handleApprove = (renewalId: number) => {
    const formData = new FormData();
    formData.append("renewal_id", String(renewalId));
    formData.append("approved_by", "馆员");
    approveAction(formData);
  };

  const handleReject = () => {
    if (!selectedRenewal()) return;
    const formData = new FormData();
    formData.append("renewal_id", String(selectedRenewal()!));
    formData.append("approved_by", "馆员");
    formData.append("notes", (document.getElementById("reject-notes") as HTMLTextAreaElement)?.value || "");
    rejectAction(formData);
    setShowRejectModal(false);
    setSelectedRenewal(null);
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">续借管理</h1>
          <p class="text-gray-500">管理馆际互借的续借申请</p>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              class={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter() === "all"
                  ? "bg-primary-100 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter("pending")}
              class={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter() === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              待审批
            </button>
            <button
              onClick={() => setFilter("approved")}
              class={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter() === "approved"
                  ? "bg-green-100 text-green-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              已批准
            </button>
            <button
              onClick={() => setFilter("rejected")}
              class={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter() === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              已拒绝
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        {(!filteredRenewals() || filteredRenewals()?.length === 0) ? (
          <EmptyState 
            icon="🔄" 
            title="暂无续借申请" 
            description="没有找到符合条件的续借申请记录"
          />
        ) : (
          <For each={filteredRenewals()}>
            {(renewal: RenewalRequest) => {
              const request = getRequestInfo(renewal.ill_request_id);
              return (
                <div class="card">
                  <div class="card-body">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <span class={`badge ${
                            renewal.status === "approved" ? "bg-green-100 text-green-800" :
                            renewal.status === "rejected" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {renewal.status === "approved" ? "已批准" :
                             renewal.status === "rejected" ? "已拒绝" : "待审批"}
                          </span>
                          <span class="text-sm text-gray-500">
                            申请日期：{renewal.request_date}
                          </span>
                        </div>
                        <Show when={request}>
                          {(req) => (
                            <>
                              <A 
                                href={`/requests/${req().id}`}
                                class="text-lg font-semibold text-gray-900 hover:text-primary-600"
                              >
                                {req().book_title}
                              </A>
                              <p class="text-sm text-gray-500 mt-1">
                                读者：{req().reader_name} | 
                                申请馆：{req().requesting_library_name} | 
                                当前到期日：{req().due_date} → 新到期日：{renewal.new_due_date}
                              </p>
                            </>
                          )}
                        </Show>
                        <div class="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p class="text-sm text-gray-600">
                            <span class="font-medium">续借原因：</span>
                            {renewal.reason}
                          </p>
                          <p class="text-sm text-gray-500 mt-1">
                            申请人：{renewal.requested_by}
                          </p>
                        </div>
                      </div>
                      <Show when={renewal.status === "pending"}>
                        <div class="flex gap-2">
                          <button
                            onClick={() => handleApprove(renewal.id)}
                            class="btn-success text-sm"
                          >
                            批准
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRenewal(renewal.id);
                              setShowRejectModal(true);
                            }}
                            class="btn-danger text-sm"
                          >
                            拒绝
                          </button>
                        </div>
                      </Show>
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        )}
      </div>

      <Show when={showRejectModal()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl max-w-md w-full">
            <div class="p-6 border-b border-gray-200">
              <h3 class="text-lg font-semibold">拒绝续借申请</h3>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">拒绝原因</label>
                <textarea id="reject-notes" class="textarea" rows={3} placeholder="请输入拒绝原因..." />
              </div>
              <div class="flex justify-end gap-3">
                <button onClick={() => setShowRejectModal(false)} class="btn-secondary">
                  取消
                </button>
                <button onClick={handleReject} class="btn-danger">
                  确认拒绝
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
