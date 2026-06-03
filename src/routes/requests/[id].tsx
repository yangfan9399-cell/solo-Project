import { A, useParams } from "@solidjs/router";
import { createAsync, useAction } from "@solidjs/router";
import { createSignal, For, Show, Match, Switch } from "solid-js";
import StatusBadge from "~/components/StatusBadge";
import EmptyState from "~/components/EmptyState";
import {
  getILLRequestAction,
  getLibrariesAction,
  getLogisticsRecordsAction,
  getRenewalRequestsAction,
  matchLibraryAction,
  approveLendingAction,
  shipBookAction,
  receiveBookAction,
  startLendingAction,
  createRenewalRequestAction,
  returnBookAction,
  completeRequestAction,
  rejectRequestAction,
  cancelRequestAction,
  createExceptionAction
} from "~/server/actions";
import type { ILLRequestDetail } from "~/server/db";

export default function RequestDetail() {
  const params = useParams();
  const requestId = () => Number(params.id);
  
  const request = createAsync(() => getILLRequestAction(requestId()));
  const libraries = createAsync(() => getLibrariesAction());
  const logistics = createAsync(() => getLogisticsRecordsAction(requestId()));
  const renewals = createAsync(() => getRenewalRequestsAction(requestId()));

  const [showMatchModal, setShowMatchModal] = createSignal(false);
  const [showShipModal, setShowShipModal] = createSignal(false);
  const [showRenewalModal, setShowRenewalModal] = createSignal(false);
  const [showRejectModal, setShowRejectModal] = createSignal(false);
  const [showExceptionModal, setShowExceptionModal] = createSignal(false);

  const matchAction = useAction(matchLibraryAction);
  const approveAction = useAction(approveLendingAction);
  const shipAction = useAction(shipBookAction);
  const receiveAction = useAction(receiveBookAction);
  const startLendingActionFn = useAction(startLendingAction);
  const renewalAction = useAction(createRenewalRequestAction);
  const returnAction = useAction(returnBookAction);
  const completeAction = useAction(completeRequestAction);
  const rejectAction = useAction(rejectRequestAction);
  const cancelAction = useAction(cancelRequestAction);
  const exceptionAction = useAction(createExceptionAction);

  const canMatch = () => request()?.status === "pending";
  const canApprove = () => request()?.status === "matched";
  const canShip = () => request()?.status === "approved";
  const canReceive = () => request()?.status === "shipped";
  const canStartLending = () => request()?.status === "received";
  const canRenew = () => ["lending", "renew_approved"].includes(request()?.status || "");
  const canReturn = () => ["lending", "renew_approved", "overdue", "renew_requested"].includes(request()?.status || "");
  const canComplete = () => request()?.status === "returned";
  const canReject = () => ["pending", "matched"].includes(request()?.status || "");
  const canCancel = () => ["pending", "matched", "approved"].includes(request()?.status || "");
  const canReportException = () => !["completed", "rejected", "cancelled"].includes(request()?.status || "");

  const timeline = () => {
    const req = request();
    if (!req) return [];
    
    const items: { status: string; date: string; label: string; done: boolean }[] = [
      { status: "pending", date: req.request_date, label: "提交申请", done: true }
    ];

    if (req.status !== "pending" && req.status !== "rejected" && req.status !== "cancelled") {
      items.push({ status: "matched", date: req.updated_at, label: "匹配提供馆", done: true });
    }
    if (["approved", "shipped", "received", "lending", "renew_requested", "renew_approved", "overdue", "returned", "completed"].includes(req.status)) {
      items.push({ status: "approved", date: req.updated_at, label: "审批通过", done: true });
    }
    if (["shipped", "received", "lending", "renew_requested", "renew_approved", "overdue", "returned", "completed"].includes(req.status)) {
      items.push({ status: "shipped", date: req.updated_at, label: "图书寄出", done: true });
    }
    if (["received", "lending", "renew_requested", "renew_approved", "overdue", "returned", "completed"].includes(req.status)) {
      items.push({ status: "received", date: req.updated_at, label: "图书到馆", done: true });
    }
    if (["lending", "renew_requested", "renew_approved", "overdue", "returned", "completed"].includes(req.status)) {
      items.push({ status: "lending", date: req.updated_at, label: "开始借阅", done: true });
    }
    if (["returned", "completed"].includes(req.status)) {
      items.push({ status: "returned", date: req.return_date || "", label: "图书归还", done: true });
    }
    if (req.status === "completed") {
      items.push({ status: "completed", date: req.updated_at, label: "申请完成", done: true });
    }

    return items;
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <A href="/requests" class="text-gray-500 hover:text-gray-700">
            ← 返回列表
          </A>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              申请详情 <span class="font-mono text-primary-600">{request()?.request_no}</span>
            </h1>
          </div>
        </div>
        <Show when={request()}>
          <StatusBadge status={request()!.status} />
        </Show>
      </div>

      <Switch>
        <Match when={!request()}>
          <EmptyState icon="❓" title="申请不存在" description="找不到该申请记录" />
        </Match>
        <Match when={request()}>
          {(req) => (
            <>
              <div class="card">
                <div class="card-header">
                  <h2 class="text-lg font-semibold text-gray-900">流转进度</h2>
                </div>
                <div class="card-body">
                  <div class="flex items-center justify-between">
                    <For each={timeline()}>
                      {(item, index) => (
                        <div class="flex items-center">
                          <div class="flex flex-col items-center">
                            <div class={`w-10 h-10 rounded-full flex items-center justify-center ${
                              item.done ? "bg-primary-500 text-white" : "bg-gray-200 text-gray-400"
                            }`}>
                              {index() + 1}
                            </div>
                            <p class="mt-2 text-sm font-medium text-gray-900">{item.label}</p>
                          </div>
                          <Show when={index() < timeline().length - 1}>
                            <div class={`w-16 h-1 mx-2 ${item.done ? "bg-primary-500" : "bg-gray-200"}`}></div>
                          </Show>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 space-y-6">
                  <div class="card">
                    <div class="card-header">
                      <h2 class="text-lg font-semibold text-gray-900">图书信息</h2>
                    </div>
                    <div class="card-body">
                      <div class="flex items-start gap-4">
                        <div class="w-20 h-28 bg-gray-100 rounded-lg flex items-center justify-center text-4xl">
                          📖
                        </div>
                        <div class="flex-1">
                          <h3 class="text-lg font-semibold text-gray-900">{req().book_title}</h3>
                          <p class="text-gray-500">{req().book_author}</p>
                          <p class="text-sm text-gray-400 mt-1">ISBN: {req().book_isbn}</p>
                          <div class="flex gap-4 mt-3 text-sm">
                            <div>
                              <span class="text-gray-500">申请馆：</span>
                              <span class="font-medium">{req().requesting_library_name}</span>
                            </div>
                            <div>
                              <span class="text-gray-500">提供馆：</span>
                              <span class="font-medium">{req().supplying_library_name || "待匹配"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="card">
                    <div class="card-header">
                      <h2 class="text-lg font-semibold text-gray-900">读者信息</h2>
                    </div>
                    <div class="card-body">
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <p class="text-sm text-gray-500">读者姓名</p>
                          <p class="font-medium">{req().reader_name}</p>
                        </div>
                        <div>
                          <p class="text-sm text-gray-500">读者证号</p>
                          <p class="font-medium font-mono">{req().reader_card}</p>
                        </div>
                        <div>
                          <p class="text-sm text-gray-500">申请日期</p>
                          <p class="font-medium">{req().request_date}</p>
                        </div>
                        <div>
                          <p class="text-sm text-gray-500">应还日期</p>
                          <p class={`font-medium ${req().status === "overdue" ? "text-red-600" : ""}`}>
                            {req().due_date || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="card">
                    <div class="card-header flex items-center justify-between">
                      <h2 class="text-lg font-semibold text-gray-900">物流记录</h2>
                    </div>
                    <div class="card-body">
                      <Show when={logistics() && logistics()!.length > 0} fallback={
                        <p class="text-gray-500 text-center py-4">暂无物流记录</p>
                      }>
                        <div class="space-y-3">
                          <For each={logistics()}>
                            {(record) => (
                              <div class="p-4 bg-gray-50 rounded-lg">
                                <div class="flex items-center justify-between">
                                  <span class="font-medium">
                                    {record.type === "ship" ? "📦 寄出" : "📥 归还"}
                                  </span>
                                  <span class="text-sm text-gray-500">{record.send_date}</span>
                                </div>
                                <div class="mt-2 text-sm text-gray-600">
                                  <p>快递公司：{record.carrier}</p>
                                  <p>物流单号：{record.tracking_number}</p>
                                  <p>寄件人：{record.sender_name} ({record.sender_contact})</p>
                                  <p>收件人：{record.receiver_name} ({record.receiver_contact})</p>
                                  <Show when={record.receive_date}>
                                    <p class="text-green-600">签收日期：{record.receive_date}</p>
                                  </Show>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </div>
                </div>

                <div class="space-y-6">
                  <div class="card">
                    <div class="card-header">
                      <h2 class="text-lg font-semibold text-gray-900">操作</h2>
                    </div>
                    <div class="card-body space-y-3">
                      <Show when={canMatch()}>
                        <button onClick={() => setShowMatchModal(true)} class="w-full btn-primary">
                          🔗 匹配提供馆
                        </button>
                      </Show>
                      <Show when={canApprove()}>
                        <form action={approveAction} method="post">
                          <input type="hidden" name="request_id" value={requestId()} />
                          <button type="submit" class="w-full btn-success">
                            ✅ 审批借出
                          </button>
                        </form>
                      </Show>
                      <Show when={canShip()}>
                        <button onClick={() => setShowShipModal(true)} class="w-full btn-primary">
                          📦 登记物流
                        </button>
                      </Show>
                      <Show when={canReceive()}>
                        <form action={receiveAction} method="post">
                          <input type="hidden" name="request_id" value={requestId()} />
                          <button type="submit" class="w-full btn-success">
                            📥 确认到馆
                          </button>
                        </form>
                      </Show>
                      <Show when={canStartLending()}>
                        <form action={startLendingActionFn} method="post">
                          <input type="hidden" name="request_id" value={requestId()} />
                          <button type="submit" class="w-full btn-success">
                            📚 开始借阅
                          </button>
                        </form>
                      </Show>
                      <Show when={canRenew()}>
                        <button onClick={() => setShowRenewalModal(true)} class="w-full btn-warning">
                          🔄 续借申请
                        </button>
                      </Show>
                      <Show when={canReturn()}>
                        <form action={returnAction} method="post">
                          <input type="hidden" name="request_id" value={requestId()} />
                          <button type="submit" class="w-full btn-secondary">
                            ↩️ 登记归还
                          </button>
                        </form>
                      </Show>
                      <Show when={canComplete()}>
                        <form action={completeAction} method="post">
                          <input type="hidden" name="request_id" value={requestId()} />
                          <button type="submit" class="w-full btn-success">
                            ✅ 完成申请
                          </button>
                        </form>
                      </Show>
                      <Show when={canReject()}>
                        <button onClick={() => setShowRejectModal(true)} class="w-full btn-danger">
                          ❌ 拒绝申请
                        </button>
                      </Show>
                      <Show when={canCancel()}>
                        <form action={cancelAction} method="post">
                          <input type="hidden" name="request_id" value={requestId()} />
                          <button type="submit" class="w-full btn-secondary">
                            ⚠️ 取消申请
                          </button>
                        </form>
                      </Show>
                      <Show when={canReportException()}>
                        <button onClick={() => setShowExceptionModal(true)} class="w-full btn-danger">
                          🚨 上报异常
                        </button>
                      </Show>
                    </div>
                  </div>

                  <Show when={renewals() && renewals()!.length > 0}>
                    <div class="card">
                      <div class="card-header">
                        <h2 class="text-lg font-semibold text-gray-900">续借记录</h2>
                      </div>
                      <div class="card-body">
                        <div class="space-y-3">
                          <For each={renewals()}>
                            {(renewal) => (
                              <div class="p-3 border border-gray-200 rounded-lg">
                                <div class="flex items-center justify-between">
                                  <span class={`badge ${
                                    renewal.status === "approved" ? "bg-green-100 text-green-800" :
                                    renewal.status === "rejected" ? "bg-red-100 text-red-800" :
                                    "bg-yellow-100 text-yellow-800"
                                  }`}>
                                    {renewal.status === "approved" ? "已批准" :
                                     renewal.status === "rejected" ? "已拒绝" : "待审批"}
                                  </span>
                                  <span class="text-sm text-gray-500">{renewal.request_date}</span>
                                </div>
                                <p class="mt-2 text-sm text-gray-600">原因：{renewal.reason}</p>
                                <p class="text-sm text-gray-600">新到期日：{renewal.new_due_date}</p>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    </div>
                  </Show>
                </div>
              </div>

              <Show when={showMatchModal()}>
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div class="bg-white rounded-xl max-w-md w-full">
                    <div class="p-6 border-b border-gray-200">
                      <h3 class="text-lg font-semibold">匹配提供馆</h3>
                    </div>
                    <form action={matchAction} method="post" class="p-6">
                      <input type="hidden" name="request_id" value={requestId()} />
                      <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          选择提供馆
                        </label>
                        <select name="library_id" class="select" required>
                          <option value="">请选择图书馆</option>
                          <For each={libraries()}>
                            {(lib) => (
                              <option value={lib.id} disabled={lib.id === req().requesting_library_id}>
                                {lib.name}
                              </option>
                            )}
                          </For>
                        </select>
                      </div>
                      <div class="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowMatchModal(false)} class="btn-secondary">
                          取消
                        </button>
                        <button type="submit" class="btn-primary">
                          确认匹配
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Show>

              <Show when={showShipModal()}>
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div class="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                    <div class="p-6 border-b border-gray-200">
                      <h3 class="text-lg font-semibold">登记物流信息</h3>
                    </div>
                    <form action={shipAction} method="post" class="p-6 space-y-4">
                      <input type="hidden" name="request_id" value={requestId()} />
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">快递公司</label>
                          <input type="text" name="carrier" class="input" required />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">物流单号</label>
                          <input type="text" name="tracking_number" class="input" required />
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">寄件人</label>
                          <input type="text" name="sender_name" class="input" required />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">寄件人电话</label>
                          <input type="text" name="sender_contact" class="input" required />
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">收件人</label>
                          <input type="text" name="receiver_name" class="input" required />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">收件人电话</label>
                          <input type="text" name="receiver_contact" class="input" required />
                        </div>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">寄出日期</label>
                        <input type="date" name="send_date" class="input" required />
                      </div>
                      <div class="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowShipModal(false)} class="btn-secondary">
                          取消
                        </button>
                        <button type="submit" class="btn-primary">
                          确认寄出
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Show>

              <Show when={showRenewalModal()}>
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div class="bg-white rounded-xl max-w-md w-full">
                    <div class="p-6 border-b border-gray-200">
                      <h3 class="text-lg font-semibold">续借申请</h3>
                    </div>
                    <form action={renewalAction} method="post" class="p-6 space-y-4">
                      <input type="hidden" name="request_id" value={requestId()} />
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">申请人</label>
                        <input type="text" name="requested_by" class="input" required />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">续借原因</label>
                        <textarea name="reason" class="textarea" rows={3} required />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">新到期日期</label>
                        <input type="date" name="new_due_date" class="input" required />
                      </div>
                      <div class="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowRenewalModal(false)} class="btn-secondary">
                          取消
                        </button>
                        <button type="submit" class="btn-primary">
                          提交申请
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Show>

              <Show when={showRejectModal()}>
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div class="bg-white rounded-xl max-w-md w-full">
                    <div class="p-6 border-b border-gray-200">
                      <h3 class="text-lg font-semibold">拒绝申请</h3>
                    </div>
                    <form action={rejectAction} method="post" class="p-6 space-y-4">
                      <input type="hidden" name="request_id" value={requestId()} />
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">拒绝原因</label>
                        <textarea name="reason" class="textarea" rows={3} required />
                      </div>
                      <div class="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowRejectModal(false)} class="btn-secondary">
                          取消
                        </button>
                        <button type="submit" class="btn-danger">
                          确认拒绝
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Show>

              <Show when={showExceptionModal()}>
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div class="bg-white rounded-xl max-w-md w-full">
                    <div class="p-6 border-b border-gray-200">
                      <h3 class="text-lg font-semibold">上报异常</h3>
                    </div>
                    <form action={exceptionAction} method="post" class="p-6 space-y-4">
                      <input type="hidden" name="request_id" value={requestId()} />
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">异常类型</label>
                        <select name="type" class="select" required>
                          <option value="damage">图书损坏</option>
                          <option value="lost">图书丢失</option>
                          <option value="delay">物流延迟</option>
                          <option value="other">其他</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">异常描述</label>
                        <textarea name="description" class="textarea" rows={3} required />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">上报人</label>
                        <input type="text" name="reported_by" class="input" required />
                      </div>
                      <div class="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowExceptionModal(false)} class="btn-secondary">
                          取消
                        </button>
                        <button type="submit" class="btn-danger">
                          提交上报
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Show>
            </>
          )}
        </Match>
      </Switch>
    </div>
  );
}
