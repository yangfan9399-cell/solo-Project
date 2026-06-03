import { A } from "@solidjs/router";
import { createAsync } from "@solidjs/router";
import { For } from "solid-js";
import StatusBadge from "~/components/StatusBadge";
import { getILLRequestsAction } from "~/server/actions";
import type { ILLRequestDetail, ILLRequestStatus } from "~/server/db";

const columns: { status: ILLRequestStatus; label: string; color: string }[] = [
  { status: "pending", label: "待匹配", color: "border-yellow-400" },
  { status: "matched", label: "已匹配", color: "border-blue-400" },
  { status: "approved", label: "已审批", color: "border-indigo-400" },
  { status: "shipped", label: "运输中", color: "border-purple-400" },
  { status: "received", label: "已到馆", color: "border-cyan-400" },
  { status: "lending", label: "借阅中", color: "border-green-400" },
  { status: "overdue", label: "已逾期", color: "border-red-400" }
];

export default function Kanban() {
  const requests = createAsync(() => getILLRequestsAction());

  const getRequestsByStatus = (status: ILLRequestStatus) => {
    return requests()?.filter((r: ILLRequestDetail) => r.status === status) || [];
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">馆际流转看板</h1>
          <p class="text-gray-500">实时查看馆际互借的流转状态</p>
        </div>
        <A href="/requests/new" class="btn-primary">
          ➕ 新建申请
        </A>
      </div>

      <div class="overflow-x-auto">
        <div class="flex gap-4 min-w-max pb-4">
          <For each={columns}>
            {(column) => {
              const columnRequests = getRequestsByStatus(column.status);
              return (
                <div class="w-72 flex-shrink-0">
                  <div class={`bg-white rounded-xl border-t-4 ${column.color} shadow-sm`}>
                    <div class="p-4 border-b border-gray-100">
                      <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-gray-900">{column.label}</h3>
                        <span class="badge bg-gray-100 text-gray-600">
                          {columnRequests.length}
                        </span>
                      </div>
                    </div>
                    <div class="p-3 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                      {columnRequests.length === 0 ? (
                        <div class="text-center py-8 text-gray-400 text-sm">
                          暂无任务
                        </div>
                      ) : (
                        <For each={columnRequests}>
                          {(req: ILLRequestDetail) => (
                            <A
                              href={`/requests/${req.id}`}
                              class="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div class="flex items-start justify-between mb-2">
                                <span class="font-mono text-xs text-primary-600">{req.request_no}</span>
                                <StatusBadge status={req.status} />
                              </div>
                              <h4 class="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                                {req.book_title}
                              </h4>
                              <p class="text-xs text-gray-500 mb-2">{req.book_author}</p>
                              <div class="flex items-center justify-between text-xs text-gray-400">
                                <span>👤 {req.reader_name}</span>
                                <span>{req.request_date}</span>
                              </div>
                            </A>
                          )}
                        </For>
                      )}
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}
