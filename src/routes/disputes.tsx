import { createResource, For, Show } from "solid-js";
import { Title } from "@solidjs/meta";

const STATUS_LABEL: Record<string, string> = {
  open: "待处理",
  under_review: "处理中",
  resolved: "已解决",
  rejected: "已驳回",
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700",
  under_review: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function Disputes() {
  const fetchDisputes = async () => {
    const res = await fetch("/api/disputes");
    return res.json();
  };

  const [disputes, { refetch }] = createResource(fetchDisputes);

  const handleResolve = async (dis: any, status: "resolved" | "rejected") => {
    const defaultPrompt = status === "resolved"
      ? "请输入解决结果：\n\n" + (dis.conflictRegNo ? `【审核参考】此为重复报名争议，冲突编号：${dis.conflictRegNo}\n解决后报名将转入复核人待审状态，冲突信息将保留供审核参考\n\n` : "")
      : "请输入驳回原因：\n\n" + (dis.conflictRegNo ? `【审核参考】此为重复报名争议，冲突编号：${dis.conflictRegNo}\n驳回后将保持重复报名状态，证书阻断继续生效\n\n` : "");

    const resolution = prompt(defaultPrompt);
    if (!resolution) return;

    await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "resolve",
        disputeId: dis.id,
        status,
        resolution,
        resolvedBy: "复核人李主任",
      }),
    });
    refetch();
  };

  return (
    <>
      <Title>资格争议 - 资格审核平台</Title>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">资格争议处理</h1>
        <div class="text-sm text-gray-500">
          共 <span class="font-semibold text-gray-700">{(disputes() ?? []).length}</span> 条争议
        </div>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-3 py-3 text-left font-semibold text-gray-600 w-24">争议ID</th>
              <th class="px-3 py-3 text-left font-semibold text-gray-600 w-24">报名链接</th>
              <th class="px-3 py-3 text-left font-semibold text-gray-600 w-32">冲突报名编号</th>
              <th class="px-3 py-3 text-left font-semibold text-gray-600">争议原因</th>
              <th class="px-3 py-3 text-left font-semibold text-gray-600 w-20">提交人</th>
              <th class="px-3 py-3 text-left font-semibold text-gray-600 w-16">状态</th>
              <th class="px-3 py-3 text-left font-semibold text-gray-600 w-48">处理结果</th>
              <th class="px-3 py-3 text-left font-semibold text-gray-600 w-28">操作</th>
            </tr>
          </thead>
          <tbody>
            <For each={disputes() ?? []} fallback={<tr><td colspan="8" class="text-center py-8 text-gray-400">暂无争议记录</td></tr>}>
              {(dis: any) => (
                <tr class="border-t hover:bg-gray-50">
                  <td class="px-3 py-3 font-mono text-xs text-gray-500">{dis.id.slice(0, 6)}...</td>
                  <td class="px-3 py-3">
                    <a href={`/registrations/${dis.registrationId}`} target="_blank" class="text-indigo-600 hover:underline text-xs font-medium">
                      查看报名 →
                    </a>
                  </td>
                  <td class="px-3 py-3">
                    <Show when={dis.conflictRegNo} fallback={<span class="text-gray-300">-</span>}>
                      <span class="inline-flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-red-500"></span>
                        <span class="font-mono text-xs text-red-700 font-semibold">{dis.conflictRegNo}</span>
                      </span>
                    </Show>
                  </td>
                  <td class="px-3 py-3 max-w-xs">
                    <div class="truncate" title={dis.reason}>{dis.reason}</div>
                  </td>
                  <td class="px-3 py-3 text-xs text-gray-600">{dis.submittedBy}</td>
                  <td class="px-3 py-3">
                    <span class={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLOR[dis.status]}`}>
                      {STATUS_LABEL[dis.status] || dis.status}
                    </span>
                  </td>
                  <td class="px-3 py-3">
                    <Show when={dis.resolution} fallback={<span class="text-gray-300 text-xs">-</span>}>
                      <div class="max-w-sm">
                        <Show when={dis.status === "rejected" && dis.conflictRegNo}>
                          <div class="text-xs text-red-600 font-medium mb-0.5">⚠ 保持证书阻断</div>
                        </Show>
                        <Show when={dis.status === "resolved" && dis.conflictRegNo}>
                          <div class="text-xs text-green-600 font-medium mb-0.5">✓ 冲突信息保留供审核</div>
                        </Show>
                        <div class="text-xs text-gray-500 truncate" title={dis.resolution}>{dis.resolution}</div>
                      </div>
                    </Show>
                  </td>
                  <td class="px-3 py-3">
                    <Show when={dis.status === "open"}>
                      <div class="flex gap-1.5">
                        <button
                          class="text-xs bg-green-600 text-white px-2.5 py-1 rounded hover:bg-green-700"
                          onClick={() => handleResolve(dis, "resolved")}
                        >
                          解决
                        </button>
                        <button
                          class="text-xs bg-red-600 text-white px-2.5 py-1 rounded hover:bg-red-700"
                          onClick={() => handleResolve(dis, "rejected")}
                        >
                          驳回
                        </button>
                      </div>
                    </Show>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </>
  );
}
