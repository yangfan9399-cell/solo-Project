import { A } from "@solidjs/router";
import { createAsync, useAction } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import StatusBadge from "~/components/StatusBadge";
import EmptyState from "~/components/EmptyState";
import { getILLRequestsAction, checkOverdueAction, createNotificationAction } from "~/server/actions";
import type { ILLRequestDetail } from "~/server/db";

export default function Overdue() {
  const [trigger, setTrigger] = createSignal(0);
  const requests = createAsync(() => {
    trigger();
    return getILLRequestsAction({ status: "overdue" });
  });
  const checkAction = useAction(checkOverdueAction);
  const notifyAction = useAction(createNotificationAction);

  const handleCheckOverdue = async () => {
    await checkAction();
    setTrigger(t => t + 1);
  };

  const handleSendReminder = (req: ILLRequestDetail) => {
    const formData = new FormData();
    formData.append("ill_request_id", String(req.id));
    formData.append("type", "overdue");
    formData.append("recipient", "reader@example.com");
    formData.append("subject", "图书逾期提醒");
    formData.append("content", `您借阅的图书《${req.book_title}》已逾期，请尽快归还。`);
    notifyAction(formData);
    alert("催还通知已发送！");
  };

  const overdueDays = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">逾期催还</h1>
          <p class="text-gray-500">管理逾期图书，发送催还通知</p>
        </div>
        <button onClick={handleCheckOverdue} class="btn-primary">
          🔄 检测逾期
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="card bg-red-50">
          <div class="card-body">
            <p class="text-sm text-red-600">逾期总数</p>
            <p class="text-3xl font-bold text-red-700">{requests()?.length || 0}</p>
          </div>
        </div>
        <div class="card bg-orange-50">
          <div class="card-body">
            <p class="text-sm text-orange-600">逾期7天以上</p>
            <p class="text-3xl font-bold text-orange-700">
              {requests()?.filter((r: ILLRequestDetail) => r.due_date && overdueDays(r.due_date) > 7).length || 0}
            </p>
          </div>
        </div>
        <div class="card bg-red-100">
          <div class="card-body">
            <p class="text-sm text-red-700">逾期30天以上</p>
            <p class="text-3xl font-bold text-red-800">
              {requests()?.filter((r: ILLRequestDetail) => r.due_date && overdueDays(r.due_date) > 30).length || 0}
            </p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-red-50 border-b border-red-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">申请编号</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">图书</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">读者</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">图书馆</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">应还日期</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">逾期天数</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">状态</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {(!requests() || requests()?.length === 0) ? (
                <tr>
                  <td colSpan={8} class="px-6 py-12">
                    <EmptyState 
                      icon="✅" 
                      title="暂无逾期记录" 
                      description="当前没有逾期的馆际互借申请"
                    />
                  </td>
                </tr>
              ) : (
                <For each={requests()}>
                  {(req: ILLRequestDetail) => (
                    <tr class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap font-mono text-sm text-primary-600">
                        <A href={`/requests/${req.id}`}>{req.request_no}</A>
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-sm font-medium text-gray-900">{req.book_title}</div>
                        <div class="text-sm text-gray-500">{req.book_author}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">{req.reader_name}</div>
                        <div class="text-sm text-gray-500">{req.reader_card}</div>
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-sm text-gray-900">{req.requesting_library_name}</div>
                        <div class="text-sm text-gray-500">{req.supplying_library_name}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {req.due_date}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class={`text-sm font-bold ${
                          req.due_date && overdueDays(req.due_date) > 30 ? "text-red-700" :
                          req.due_date && overdueDays(req.due_date) > 7 ? "text-orange-600" :
                          "text-red-500"
                        }`}>
                          {req.due_date ? overdueDays(req.due_date) : 0} 天
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={req.status} />
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex gap-2">
                          <button
                            onClick={() => handleSendReminder(req)}
                            class="text-sm text-primary-600 hover:text-primary-900"
                          >
                            发送催还
                          </button>
                          <A href={`/requests/${req.id}`} class="text-sm text-gray-600 hover:text-gray-900">
                            查看详情
                          </A>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
