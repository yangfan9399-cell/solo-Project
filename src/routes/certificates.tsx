import { createResource, For, Show, createSignal } from "solid-js";
import { Title } from "@solidjs/meta";

const STATUS_LABEL: Record<string, string> = {
  verified: "已核实",
  submitted: "已提交",
  rejected: "已驳回",
  pending: "待提交",
};

const STATUS_COLOR: Record<string, string> = {
  verified: "text-green-600",
  submitted: "text-blue-600",
  rejected: "text-red-600",
  pending: "text-yellow-600",
};

export default function Certificates() {
  const [traceCertId, setTraceCertId] = createSignal("");
  const [traceData, setTraceData] = createSignal<any>(null);
  const [traceError, setTraceError] = createSignal("");

  const fetchCerts = async () => {
    const res = await fetch("/api/certificates");
    return res.json();
  };

  const [certs] = createResource(fetchCerts);

  const handleTrace = async (certId?: string) => {
    const id = certId || traceCertId();
    if (!id) return;
    setTraceCertId(id);
    setTraceError("");
    setTraceData(null);
    const res = await fetch(`/api/certificates?trace=${id}`);
    const data = await res.json();
    if (data.error) {
      setTraceError(data.error);
    } else {
      setTraceData(data);
    }
  };

  return (
    <>
      <Title>证书管理 - 资格审核平台</Title>
      <h1 class="text-2xl font-bold text-gray-900 mb-6">证书管理</h1>

      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">证书溯源查询</h2>
        <p class="text-sm text-gray-500 mb-3">输入证书ID或点击证书列表中的"溯源"按钮，回查发证时采用的报名材料和审核意见</p>
        <div class="flex gap-3">
          <input
            type="text"
            class="border rounded px-3 py-2 text-sm flex-1"
            placeholder="输入证书ID..."
            value={traceCertId()}
            onInput={(e) => setTraceCertId(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleTrace(); }}
          />
          <button
            class="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
            onClick={() => handleTrace()}
          >
            查询
          </button>
        </div>

        <Show when={traceError()}>
          <div class="mt-4 text-red-600 text-sm">{traceError()}</div>
        </Show>

        <Show when={traceData()}>
          <div class="mt-4 border-t pt-4">
            <Show when={traceData().certificate} fallback={<div class="text-red-500 text-sm">未找到证书</div>}>
              {(() => {
                const td = traceData();
                const cert = td.certificate;
                return (
                  <>
                    <div class="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h3 class="font-semibold text-indigo-800 mb-3">证书信息</h3>
                      <div class="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
                        <div><span class="text-gray-500">证书编号：</span><span class="font-mono font-semibold text-indigo-700">{cert.certNo}</span></div>
                        <div><span class="text-gray-500">持证人：</span><span class="font-medium">{cert.applicantName}</span></div>
                        <div><span class="text-gray-500">发证人：</span>{cert.issuedBy}</div>
                        <div><span class="text-gray-500">发证日期：</span>{new Date(cert.issuedAt).toLocaleDateString("zh-CN")}</div>
                        <Show when={td.registration}>
                          <div><span class="text-gray-500">报名编号：</span><span class="font-mono">{td.registration.regNo}</span></div>
                          <div><span class="text-gray-500">报名来源：</span>{td.registration.source}</div>
                        </Show>
                        <Show when={td.course}>
                          <div><span class="text-gray-500">课程：</span>{td.course.name}（{td.course.code}）</div>
                          <div><span class="text-gray-500">及格线：</span>{td.course.passingScore} 分</div>
                        </Show>
                      </div>
                      <Show when={cert.reviewOpinion}>
                        <div class="mt-3 text-sm bg-white rounded p-2 border border-indigo-100">
                          <span class="text-gray-500">发证审核意见：</span>
                          <span class="text-gray-800">{cert.reviewOpinion}</span>
                        </div>
                      </Show>
                    </div>

                    <div class="mb-4">
                      <h3 class="font-semibold text-gray-700 mb-2">
                        发证时采用的报名材料
                        <span class="text-xs text-gray-400 font-normal ml-2">（发证时快照，不受后续材料变更影响）</span>
                      </h3>
                      <Show when={(td.materialSnapshot ?? []).length > 0} fallback={<div class="text-gray-400 text-sm">无发证时材料快照</div>}>
                        <div class="border rounded overflow-hidden">
                          <table class="w-full text-sm">
                            <thead class="bg-gray-50">
                              <tr>
                                <th class="px-3 py-2 text-left text-gray-600 font-medium">材料名称</th>
                                <th class="px-3 py-2 text-left text-gray-600 font-medium">类型</th>
                                <th class="px-3 py-2 text-left text-gray-600 font-medium">发证时状态</th>
                                <th class="px-3 py-2 text-left text-gray-600 font-medium">审核备注</th>
                              </tr>
                            </thead>
                            <tbody>
                              <For each={td.materialSnapshot ?? []}>
                                {(mat: any) => (
                                  <tr class="border-t">
                                    <td class="px-3 py-2">{mat.name}</td>
                                    <td class="px-3 py-2 text-gray-500">{mat.type}</td>
                                    <td class="px-3 py-2">
                                      <span class={STATUS_COLOR[mat.status] || "text-gray-400"}>
                                        {STATUS_LABEL[mat.status] || mat.status}
                                      </span>
                                    </td>
                                    <td class="px-3 py-2 text-gray-400 text-xs">{mat.reviewNote || "-"}</td>
                                  </tr>
                                )}
                              </For>
                            </tbody>
                          </table>
                        </div>
                      </Show>
                    </div>

                    <div>
                      <h3 class="font-semibold text-gray-700 mb-2">审核流程</h3>
                      <For each={td.auditLogs ?? []} fallback={<div class="text-gray-400 text-sm">无审核记录</div>}>
                        {(log: any) => (
                          <div class="text-sm border-l-2 border-indigo-300 pl-3 mb-2">
                            <div class="font-medium">{log.action} — {log.operator} ({log.operatorRole === "handler" ? "经办人" : "复核人"})</div>
                            <Show when={log.detail}>
                              <div class="text-gray-500 text-xs">{log.detail}</div>
                            </Show>
                            <div class="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString("zh-CN")}</div>
                          </div>
                        )}
                      </For>
                    </div>
                  </>
                );
              })()}
            </Show>
          </div>
        </Show>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <h2 class="text-lg font-semibold text-gray-800 p-6 pb-3">证书列表</h2>
        <table class="w-full text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">证书编号</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">持证人</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">发证人</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">发证日期</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">状态</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">审核意见</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <For each={certs() ?? []} fallback={<div class="text-center py-6 text-gray-400">暂无证书</div>}>
              {(cert: any) => (
                <tr class="border-t hover:bg-gray-50">
                  <td class="px-4 py-3 font-mono text-xs font-semibold text-indigo-700">{cert.certNo}</td>
                  <td class="px-4 py-3">{cert.applicantName}</td>
                  <td class="px-4 py-3">{cert.issuedBy}</td>
                  <td class="px-4 py-3 text-xs">{new Date(cert.issuedAt).toLocaleDateString("zh-CN")}</td>
                  <td class="px-4 py-3">
                    <span class={`px-2 py-1 rounded text-xs font-medium ${
                      cert.status === "active" ? "bg-green-100 text-green-700" :
                      cert.status === "archived" ? "bg-gray-100 text-gray-600" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {cert.status === "active" ? "有效" : cert.status === "archived" ? "已归档" : "已撤销"}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-500 max-w-48 truncate">{cert.reviewOpinion || "-"}</td>
                  <td class="px-4 py-3">
                    <button
                      class="text-indigo-600 hover:text-indigo-800 text-xs font-medium hover:underline"
                      onClick={() => handleTrace(cert.id)}
                    >
                      溯源
                    </button>
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
