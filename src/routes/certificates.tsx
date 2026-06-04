import { createResource, For, Show, createSignal } from "solid-js";
import { Title } from "@solidjs/meta";

export default function Certificates() {
  const [traceCertId, setTraceCertId] = createSignal("");
  const [traceData, setTraceData] = createSignal<any>(null);

  const fetchCerts = async () => {
    const res = await fetch("/api/certificates");
    return res.json();
  };

  const [certs] = createResource(fetchCerts);

  const handleTrace = async () => {
    if (!traceCertId()) return;
    const res = await fetch(`/api/certificates?trace=${traceCertId()}`);
    const data = await res.json();
    setTraceData(data);
  };

  return (
    <>
      <Title>证书管理 - 资格审核平台</Title>
      <h1 class="text-2xl font-bold text-gray-900 mb-6">证书管理</h1>

      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">证书溯源查询</h2>
        <p class="text-sm text-gray-500 mb-3">输入证书ID，回查采用的报名材料和审核意见</p>
        <div class="flex gap-3">
          <input
            type="text"
            class="border rounded px-3 py-2 text-sm flex-1"
            placeholder="输入证书ID..."
            value={traceCertId()}
            onInput={(e) => setTraceCertId(e.currentTarget.value)}
          />
          <button
            class="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
            onClick={handleTrace}
          >
            查询
          </button>
        </div>

        <Show when={traceData()}>
          <div class="mt-4 border-t pt-4">
            <Show when={traceData().certificate} fallback={<div class="text-red-500 text-sm">未找到证书</div>}>
              <div class="mb-4">
                <h3 class="font-semibold text-gray-700 mb-2">证书信息</h3>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div><span class="text-gray-500">证书编号：</span>{traceData().certificate.certNo}</div>
                  <div><span class="text-gray-500">持证人：</span>{traceData().certificate.applicantName}</div>
                  <div><span class="text-gray-500">发证人：</span>{traceData().certificate.issuedBy}</div>
                  <div><span class="text-gray-500">发证日期：</span>{new Date(traceData().certificate.issuedAt).toLocaleDateString("zh-CN")}</div>
                </div>
                <Show when={traceData().certificate.reviewOpinion}>
                  <div class="mt-2 text-sm"><span class="text-gray-500">审核意见：</span>{traceData().certificate.reviewOpinion}</div>
                </Show>
              </div>

              <div class="mb-4">
                <h3 class="font-semibold text-gray-700 mb-2">采用的报名材料</h3>
                <For each={traceData().materials ?? []} fallback={<div class="text-gray-400 text-sm">无材料记录</div>}>
                  {(mat: any) => (
                    <div class="flex items-center justify-between py-1 border-b last:border-0 text-sm">
                      <span>{mat.name} ({mat.type})</span>
                      <span class={mat.status === "verified" ? "text-green-600" : "text-gray-400"}>
                        {mat.status === "verified" ? "已核实" : mat.status}
                      </span>
                    </div>
                  )}
                </For>
              </div>

              <div>
                <h3 class="font-semibold text-gray-700 mb-2">审核流程</h3>
                <For each={traceData().auditLogs ?? []} fallback={<div class="text-gray-400 text-sm">无审核记录</div>}>
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
            </tr>
          </thead>
          <tbody>
            <For each={certs() ?? []} fallback={<div class="text-center py-6 text-gray-400">暂无证书</div>}>
              {(cert: any) => (
                <tr class="border-t hover:bg-gray-50">
                  <td class="px-4 py-3 font-mono text-xs">{cert.certNo}</td>
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
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </>
  );
}
