import { createResource, For, Show } from "solid-js";
import { Title } from "@solidjs/meta";

export default function Disputes() {
  const fetchDisputes = async () => {
    const res = await fetch("/api/disputes");
    return res.json();
  };

  const [disputes, { refetch }] = createResource(fetchDisputes);

  const handleResolve = async (disputeId: string, status: "resolved" | "rejected") => {
    const resolution = prompt(status === "resolved" ? "请输入解决结果：" : "请输入驳回原因：");
    if (!resolution) return;
    await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "resolve",
        disputeId,
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
      <h1 class="text-2xl font-bold text-gray-900 mb-6">资格争议处理</h1>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">争议ID</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">报名ID</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">争议原因</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">提交人</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">状态</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">处理结果</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <For each={disputes() ?? []} fallback={<div class="text-center py-8 text-gray-400">暂无争议记录</div>}>
              {(dis: any) => (
                <tr class="border-t hover:bg-gray-50">
                  <td class="px-4 py-3 font-mono text-xs">{dis.id.slice(0, 8)}...</td>
                  <td class="px-4 py-3">
                    <a href={`/registrations/${dis.registrationId}`} class="text-indigo-600 hover:underline text-xs">
                      查看报名
                    </a>
                  </td>
                  <td class="px-4 py-3 max-w-64 truncate">{dis.reason}</td>
                  <td class="px-4 py-3">{dis.submittedBy}</td>
                  <td class="px-4 py-3">
                    <span class={`px-2 py-1 rounded text-xs font-medium ${
                      dis.status === "open" ? "bg-yellow-100 text-yellow-700" :
                      dis.status === "under_review" ? "bg-blue-100 text-blue-700" :
                      dis.status === "resolved" ? "bg-green-100 text-green-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {dis.status === "open" ? "待处理" : dis.status === "under_review" ? "处理中" : dis.status === "resolved" ? "已解决" : "已驳回"}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-500 max-w-48 truncate">{dis.resolution || "-"}</td>
                  <td class="px-4 py-3">
                    <Show when={dis.status === "open"}>
                      <div class="flex gap-2">
                        <button
                          class="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          onClick={() => handleResolve(dis.id, "resolved")}
                        >
                          解决
                        </button>
                        <button
                          class="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          onClick={() => handleResolve(dis.id, "rejected")}
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
