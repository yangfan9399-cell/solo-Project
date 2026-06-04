import { createResource, Show, For, createSignal } from "solid-js";
import { Title } from "@solidjs/meta";
import { useParams, useNavigate } from "@solidjs/router";

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

export default function RegistrationDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const [actionMsg, setActionMsg] = createSignal("");

  const fetchDetail = async () => {
    const res = await fetch(`/api/registrations/${params.id}`);
    return res.json();
  };

  const [detail, { refetch }] = createResource(fetchDetail);

  const handleReview = async (qualified: boolean) => {
    const opinion = prompt("请输入审核意见：");
    if (opinion === null) return;
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "review",
        regId: params.id,
        qualified,
        operator: "复核人李主任",
        opinion,
      }),
    });
    const data = await res.json();
    setActionMsg(data.error || "审核完成");
    refetch();
  };

  const handleMarkMissing = async () => {
    const note = prompt("请说明缺失材料：");
    if (note === null) return;
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark_missing",
        regId: params.id,
        operator: "复核人李主任",
        note,
      }),
    });
    refetch();
  };

  const handleReturn = async () => {
    const reason = prompt("请输入退回原因：");
    if (reason === null) return;
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "return",
        regId: params.id,
        operator: "复核人李主任",
        reason,
      }),
    });
    refetch();
  };

  const handleSupplementMaterial = async (materialId?: string) => {
    const name = prompt("材料名称：");
    if (!name) return;
    const type = prompt("材料类型(id_copy/certificate/transcript/photo/other)：") || "other";
    const res = await fetch("/api/materials/supplement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        regId: params.id,
        materialId,
        name,
        type,
        operator: "经办人王明",
      }),
    });
    const data = await res.json();
    setActionMsg(data.error || "材料已补交");
    refetch();
  };

  const handleUpdateGrade = async () => {
    const score = prompt("请输入成绩：");
    if (!score) return;
    const d = detail();
    if (!d) return;
    const res = await fetch("/api/grades/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        regId: params.id,
        courseId: d.registration.courseId,
        score,
        operator: "经办人王明",
      }),
    });
    const data = await res.json();
    if (data.error) {
      setActionMsg(data.error);
    } else {
      setActionMsg(data.passed ? `成绩达标（${data.passingScore}分），已流转复核人确认发证` : `成绩未达标（要求${data.passingScore}分）`);
    }
    refetch();
  };

  const handleIssueCert = async () => {
    const opinion = prompt("请输入发证审核意见：");
    if (opinion === null) return;
    const res = await fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "issue",
        regId: params.id,
        operator: "复核人李主任",
        reviewOpinion: opinion,
      }),
    });
    const data = await res.json();
    setActionMsg(data.error || `证书已发放：${data.certNo}`);
    refetch();
  };

  const handleSubmitDispute = async () => {
    const reason = prompt("请输入争议原因：");
    if (!reason) return;
    const res = await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        registrationId: params.id,
        reason,
        submittedBy: "经办人王明",
      }),
    });
    const data = await res.json();
    if (data.error) {
      setActionMsg(data.error);
    } else if (data.conflictRegNo) {
      setActionMsg(`资格争议已提交（重复报名，冲突编号：${data.conflictRegNo}）`);
    } else {
      setActionMsg("资格争议已提交");
    }
    refetch();
  };

  return (
    <>
      <Title>报名详情 - 资格审核平台</Title>
      <Show when={!detail.loading} fallback={<div class="text-gray-500">加载中...</div>}>
        <Show when={detail()} fallback={<div class="text-gray-500">加载中...</div>}>
          {(() => {
            const d = detail() as any;
            if (!d?.registration) return <div class="text-red-500">未找到报名记录</div>;
            const reg = d.registration;

            return (
              <div>
                <div class="flex items-center justify-between mb-6">
                  <div class="flex items-center gap-3">
                    <button
                      class="text-gray-500 hover:text-gray-700 text-sm"
                      onClick={() => navigate("/")}
                    >
                      ← 返回列表
                    </button>
                    <h1 class="text-2xl font-bold text-gray-900">报名详情</h1>
                  </div>
                  <span class={`px-3 py-1 rounded text-sm font-medium ${STATUS_MAP[reg.status]?.color || "bg-gray-100 text-gray-600"}`}>
                    {STATUS_MAP[reg.status]?.label || reg.status}
                  </span>
                </div>

                <Show when={reg.status === "duplicate"}>
                  <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 text-red-700 font-semibold">
                          <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                          重复报名 — 冲突报名编号：
                          <span class="font-mono text-lg">{reg.conflictRegNo}</span>
                        </div>
                        <p class="text-red-600 text-sm mt-1">该报名与已有报名冲突，证书发放已被阻断。</p>
                      </div>
                      <button
                        class="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 flex-shrink-0"
                        onClick={handleSubmitDispute}
                      >
                        提交资格争议
                      </button>
                    </div>
                  </div>
                </Show>

                <Show when={actionMsg()}>
                  <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-blue-700 text-sm">{actionMsg()}</div>
                </Show>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div class="lg:col-span-2 space-y-6">
                    <div class="bg-white rounded-lg shadow p-6">
                      <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">基本信息</h2>
                      <div class="grid grid-cols-2 gap-4 text-sm">
                        <div><span class="text-gray-500">报名编号：</span><span class="font-mono">{reg.regNo}</span></div>
                        <div><span class="text-gray-500">姓名：</span>{reg.applicantName}</div>
                        <div><span class="text-gray-500">证件号：</span>{reg.applicantIdNo}</div>
                        <div><span class="text-gray-500">报名来源：</span>{reg.source}</div>
                        <div><span class="text-gray-500">课程：</span>{d.course?.name || reg.courseId}</div>
                        <div><span class="text-gray-500">当前责任人：</span>{reg.currentAssignee || "-"} ({reg.currentRole === "handler" ? "经办人" : "复核人"})</div>
                        <div><span class="text-gray-500">创建时间：</span>{new Date(reg.createdAt).toLocaleString("zh-CN")}</div>
                        <div><span class="text-gray-500">最近更新：</span>{new Date(reg.updatedAt).toLocaleString("zh-CN")}</div>
                      </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                      <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">材料清单</h2>
                      <For each={d.materials ?? []} fallback={<div class="text-gray-400 text-sm">暂无材料</div>}>
                        {(mat: any) => (
                          <div class="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                            <div>
                              <span class="font-medium">{mat.name}</span>
                              <span class="text-gray-400 ml-2">({mat.type})</span>
                            </div>
                            <span class={`px-2 py-0.5 rounded text-xs ${
                              mat.status === "verified" ? "bg-green-100 text-green-700" :
                              mat.status === "submitted" ? "bg-blue-100 text-blue-700" :
                              mat.status === "rejected" ? "bg-red-100 text-red-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>
                              {mat.status === "verified" ? "已核实" : mat.status === "submitted" ? "已提交" : mat.status === "rejected" ? "已驳回" : "待提交"}
                            </span>
                          </div>
                        )}
                      </For>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                      <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">成绩记录</h2>
                      <For each={d.grades ?? []} fallback={<div class="text-gray-400 text-sm">暂无成绩</div>}>
                        {(g: any) => (
                          <div class="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                            <div>
                              <span class="font-medium">{g.score} 分</span>
                              <span class="text-gray-400 ml-2">录入人：{g.recordedBy}</span>
                            </div>
                            <span class={`px-2 py-0.5 rounded text-xs ${Number(g.passed) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {Number(g.passed) ? "达标" : "未达标"}
                            </span>
                          </div>
                        )}
                      </For>
                      <Show when={d.course}>
                        <div class="mt-2 text-xs text-gray-400">及格线：{d.course.passingScore} 分</div>
                      </Show>
                    </div>

                    <Show when={(d.certificates ?? []).length > 0}>
                      <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">证书信息</h2>
                        <For each={d.certificates}>
                          {(cert: any) => (
                            <div class="py-3 border-b last:border-0">
                              <div class="flex items-center justify-between text-sm mb-2">
                                <span class="font-mono font-semibold text-indigo-700">{cert.certNo}</span>
                                <span class={`px-2 py-0.5 rounded text-xs ${
                                  cert.status === "active" ? "bg-green-100 text-green-700" :
                                  cert.status === "archived" ? "bg-gray-100 text-gray-600" :
                                  "bg-red-100 text-red-700"
                                }`}>
                                  {cert.status === "active" ? "有效" : cert.status === "archived" ? "已归档" : "已撤销"}
                                </span>
                              </div>
                              <div class="text-xs text-gray-500">发证人：{cert.issuedBy} | 发证日期：{new Date(cert.issuedAt).toLocaleDateString("zh-CN")}</div>
                              <Show when={cert.reviewOpinion}>
                                <div class="text-xs text-gray-500 mt-1">审核意见：{cert.reviewOpinion}</div>
                              </Show>
                              <Show when={cert.status === "active"}>
                                <button
                                  class="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                                  onClick={async () => {
                                    if (!confirm("确认归档此证书？")) return;
                                    await fetch("/api/certificates", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ action: "archive", certId: cert.id, operator: "复核人李主任" }),
                                    });
                                    refetch();
                                  }}
                                >
                                  归档证书
                                </button>
                              </Show>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>

                    <Show when={(d.disputes ?? []).length > 0}>
                      <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">资格争议</h2>
                        <For each={d.disputes}>
                          {(dis: any) => (
                            <div class="py-3 border-b last:border-0">
                              <div class="flex items-center justify-between text-sm mb-1">
                                <div class="flex items-center gap-2">
                                  <span class={`px-2 py-0.5 rounded text-xs ${
                                    dis.status === "open" ? "bg-yellow-100 text-yellow-700" :
                                    dis.status === "under_review" ? "bg-blue-100 text-blue-700" :
                                    dis.status === "resolved" ? "bg-green-100 text-green-700" :
                                    "bg-red-100 text-red-700"
                                  }`}>
                                    {dis.status === "open" ? "待处理" : dis.status === "under_review" ? "处理中" : dis.status === "resolved" ? "已解决" : "已驳回"}
                                  </span>
                                  <Show when={dis.conflictRegNo}>
                                    <span class="text-xs text-gray-400 font-mono">
                                      冲突：{dis.conflictRegNo}
                                    </span>
                                  </Show>
                                </div>
                                <span class="text-xs text-gray-400">{new Date(dis.createdAt).toLocaleString("zh-CN")}</span>
                              </div>
                              <div class="text-sm text-gray-700">
                                <span class="text-xs text-gray-400">{dis.submittedBy}：</span>
                                {dis.reason}
                              </div>
                              <Show when={dis.status === "resolved"}>
                                <div class="mt-1 p-2 bg-green-50 border border-green-100 rounded text-sm">
                                  <div class="text-green-700">
                                    <span class="font-medium">已解决：</span>
                                    {dis.resolution}
                                  </div>
                                  <Show when={dis.conflictRegNo}>
                                    <div class="text-green-600 text-xs mt-0.5">
                                      此为重复报名争议，冲突编号「{dis.conflictRegNo}」已保留供审核参考，报名已转入复核人待审
                                    </div>
                                  </Show>
                                </div>
                              </Show>
                              <Show when={dis.status === "rejected"}>
                                <div class="mt-1 p-2 bg-red-50 border border-red-100 rounded text-sm">
                                  <div class="text-red-700">
                                    <span class="font-medium">已驳回：</span>
                                    {dis.resolution}
                                  </div>
                                  <Show when={dis.conflictRegNo}>
                                    <div class="text-red-600 text-xs mt-0.5">
                                      保持重复报名状态，证书阻断继续生效（冲突编号：{dis.conflictRegNo}），当前责任已退回经办人
                                    </div>
                                  </Show>
                                </div>
                              </Show>
                              <Show when={dis.status === "open"}>
                                <div class="mt-2 flex gap-2">
                                  <button
                                    class="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                    onClick={async () => {
                                      const resolution = prompt("请输入解决结果：");
                                      if (!resolution) return;
                                      await fetch("/api/disputes", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ action: "resolve", disputeId: dis.id, status: "resolved", resolution, resolvedBy: "复核人李主任" }),
                                      });
                                      refetch();
                                    }}
                                  >
                                    解决争议
                                  </button>
                                  <button
                                    class="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                    onClick={async () => {
                                      const resolution = prompt("请输入驳回原因：");
                                      if (!resolution) return;
                                      await fetch("/api/disputes", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ action: "resolve", disputeId: dis.id, status: "rejected", resolution, resolvedBy: "复核人李主任" }),
                                      });
                                      refetch();
                                    }}
                                  >
                                    驳回争议
                                  </button>
                                </div>
                              </Show>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>

                  <div class="space-y-6">
                    <div class="bg-white rounded-lg shadow p-6">
                      <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">操作</h2>

                      <div class="space-y-3">
                        <Show when={reg.currentRole === "handler"}>
                          <div class="text-xs text-gray-500 mb-2 font-semibold">经办人操作</div>

                          <Show when={reg.status === "material_missing"}>
                            <div class="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700 mb-2">
                              有材料缺失，请补交后流转复核人
                            </div>
                            <For each={(d.materials ?? []).filter((m: any) => m.status === "pending" || m.status === "rejected")}>
                              {(mat: any) => (
                                <button
                                  class="w-full bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600 mb-1"
                                  onClick={() => handleSupplementMaterial(mat.id)}
                                >
                                  补交：{mat.name}（{mat.status === "pending" ? "待提交" : "已驳回"}）
                                </button>
                              )}
                            </For>
                            <button
                              class="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                              onClick={() => handleSupplementMaterial()}
                            >
                              补交其他材料
                            </button>
                          </Show>

                          <Show when={reg.status !== "material_missing" && reg.status !== "cert_issued" && reg.status !== "archived" && reg.status !== "duplicate"}>
                            <button
                              class="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                              onClick={() => handleSupplementMaterial()}
                            >
                              补交材料
                            </button>
                          </Show>

                          <Show when={reg.status !== "cert_issued" && reg.status !== "archived" && reg.status !== "duplicate"}>
                            <button
                              class="w-full bg-teal-600 text-white px-4 py-2 rounded text-sm hover:bg-teal-700"
                              onClick={handleUpdateGrade}
                            >
                              录入/更新成绩
                            </button>
                          </Show>

                          <Show when={reg.status !== "cert_issued" && reg.status !== "archived"}>
                            <button
                              class="w-full bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700"
                              onClick={handleSubmitDispute}
                            >
                              提交资格争议
                            </button>
                          </Show>
                        </Show>

                        <Show when={reg.currentRole === "reviewer"}>
                          <div class="text-xs text-gray-500 mb-2 font-semibold">复核人操作</div>

                          <Show when={reg.status === "duplicate"}>
                            <div class="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-2">
                              重复报名 — 冲突编号：
                              <span class="font-mono font-bold">{reg.conflictRegNo}</span>
                              <br />证书发放已阻断，如需处理请通过资格争议
                            </div>
                          </Show>

                          <Show when={reg.status === "material_missing"}>
                            <div class="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700 mb-2">
                              材料缺失中，等待经办人补交材料
                            </div>
                          </Show>

                          <Show when={reg.status === "grade_not_met"}>
                            <div class="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 mb-2">
                              成绩未达标，等待经办人更新成绩
                            </div>
                          </Show>

                          <Show when={reg.status !== "duplicate" && reg.status !== "cert_issued" && reg.status !== "archived" && reg.status !== "material_missing" && reg.status !== "grade_not_met"}>
                            <button
                              class="w-full bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                              onClick={() => handleReview(true)}
                            >
                              审核通过
                            </button>
                            <button
                              class="w-full bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                              onClick={() => handleReview(false)}
                            >
                              审核不通过
                            </button>
                            <button
                              class="w-full bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700"
                              onClick={handleMarkMissing}
                            >
                              标记材料缺失
                            </button>
                            <button
                              class="w-full bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                              onClick={handleReturn}
                            >
                              退回经办人
                            </button>
                          </Show>

                          <Show when={reg.status === "course_completed" || reg.status === "qualified"}>
                            <button
                              class="w-full bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 mt-1"
                              onClick={handleIssueCert}
                            >
                              确认发放证书
                            </button>
                          </Show>

                          <Show when={reg.status === "cert_issued"}>
                            <div class="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-700 mb-2">
                              证书已发放，可进行归档
                            </div>
                          </Show>

                          <Show when={reg.status === "archived"}>
                            <div class="bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-600 mb-2">
                              已归档，无需进一步操作
                            </div>
                          </Show>
                        </Show>
                      </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                      <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">最近改动</h2>
                      <div class="space-y-3 max-h-80 overflow-y-auto">
                        <For each={(d.auditLogs ?? []).slice(0, 10)} fallback={<div class="text-gray-400 text-sm">暂无操作记录</div>}>
                          {(log: any) => (
                            <div class="text-sm border-l-2 border-indigo-300 pl-3">
                              <div class="flex items-center justify-between">
                                <span class="font-medium text-gray-700">{log.action}</span>
                                <span class="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString("zh-CN")}</span>
                              </div>
                              <div class="text-gray-500 text-xs mt-0.5">{log.operator} ({log.operatorRole === "handler" ? "经办人" : "复核人"})</div>
                              <Show when={log.detail}>
                                <div class="text-gray-600 text-xs mt-0.5">{log.detail}</div>
                              </Show>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </Show>
      </Show>
    </>
  );
}
