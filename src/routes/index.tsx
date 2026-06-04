import { createSignal, createResource, For, Show } from "solid-js";
import { Title } from "@solidjs/meta";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "待审核", color: "bg-yellow-100 text-yellow-800" },
  material_missing: { label: "材料缺失", color: "bg-orange-100 text-orange-800" },
  under_review: { label: "审核中", color: "bg-blue-100 text-blue-800" },
  qualified: { label: "资格通过", color: "bg-green-100 text-green-800" },
  unqualified: { label: "资格不通过", color: "bg-red-100 text-red-800" },
  grade_not_met: { label: "成绩未达标", color: "bg-red-100 text-red-800" },
  duplicate: { label: "重复报名", color: "bg-purple-100 text-purple-800" },
  course_completed: { label: "课程完成", color: "bg-teal-100 text-teal-800" },
  cert_issued: { label: "已发证", color: "bg-indigo-100 text-indigo-800" },
  archived: { label: "已归档", color: "bg-gray-200 text-gray-700" },
};

export default function RegistrationQueue() {
  const [statusFilter, setStatusFilter] = createSignal("");
  const [keyword, setKeyword] = createSignal("");

  const fetchRegistrations = async () => {
    const params = new URLSearchParams();
    if (statusFilter()) params.set("status", statusFilter());
    if (keyword()) params.set("keyword", keyword());
    const res = await fetch(`/api/registrations?${params}`);
    return res.json();
  };

  const [registrations, { refetch }] = createResource(fetchRegistrations);

  const handleFilter = () => {
    refetch();
  };

  return (
    <>
      <Title>报名队列 - 资格审核平台</Title>
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">报名队列</h1>
        <div class="flex gap-3 items-center flex-wrap">
          <select
            class="border rounded px-3 py-2 text-sm"
            value={statusFilter()}
            onChange={(e) => setStatusFilter(e.currentTarget.value)}
          >
            <option value="">全部状态</option>
            <For each={Object.entries(STATUS_MAP)}>
              {([key, val]) => <option value={key}>{val.label}</option>}
            </For>
          </select>
          <input
            type="text"
            class="border rounded px-3 py-2 text-sm flex-1 min-w-48"
            placeholder="搜索姓名或报名编号..."
            value={keyword()}
            onInput={(e) => setKeyword(e.currentTarget.value)}
          />
          <button
            class="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
            onClick={handleFilter}
          >
            查询
          </button>
        </div>
      </div>

      <Show when={!registrations.loading} fallback={<div class="text-gray-500">加载中...</div>}>
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">报名编号</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">姓名</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">证件号</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">报名来源</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">状态</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">当前责任人</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">冲突报名</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              <For each={registrations() ?? []}>
                {(reg: any) => (
                  <tr class="border-t hover:bg-gray-50">
                    <td class="px-4 py-3 font-mono text-xs">{reg.regNo}</td>
                    <td class="px-4 py-3">{reg.applicantName}</td>
                    <td class="px-4 py-3 text-xs text-gray-500">{reg.applicantIdNo}</td>
                    <td class="px-4 py-3">{reg.source}</td>
                    <td class="px-4 py-3">
                      <span class={`px-2 py-1 rounded text-xs font-medium ${STATUS_MAP[reg.status]?.color || "bg-gray-100 text-gray-600"}`}>
                        {STATUS_MAP[reg.status]?.label || reg.status}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm">
                      <span class="text-gray-600">{reg.currentAssignee || "-"}</span>
                      <Show when={reg.currentRole}>
                        <span class="ml-1 text-xs text-gray-400">({reg.currentRole === "handler" ? "经办人" : "复核人"})</span>
                      </Show>
                    </td>
                    <td class="px-4 py-3">
                      <Show when={reg.conflictRegNo} fallback={<span class="text-gray-300">-</span>}>
                        <span class="text-red-600 font-mono text-xs font-semibold">{reg.conflictRegNo}</span>
                      </Show>
                    </td>
                    <td class="px-4 py-3">
                      <a
                        href={`/registrations/${reg.id}`}
                        class="text-indigo-600 hover:underline text-sm"
                      >
                        详情
                      </a>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
          <Show when={(registrations() ?? []).length === 0}>
            <div class="text-center py-8 text-gray-400">暂无报名记录</div>
          </Show>
        </div>
      </Show>
    </>
  );
}
