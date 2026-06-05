import { useState, type ReactNode } from "react";
import { useLoaderData, useNavigate, Form, useActionData, redirect, useOutletContext } from "react-router";
import { StatusBadge } from "~/components/StatusBadge";
import { ConstructionTypeBadge } from "~/components/ConstructionTypeBadge";
import {
  getPermitById,
  getPermitHistories,
  getPermitWorkers,
  getTeamById,
  getAreaById,
  confirmArea,
  markAreaConflict,
  confirmSafety,
  rejectSafety,
  resubmitSafety,
  supplyDocuments,
  checkIn,
  checkOut,
  updateAreaAndResubmit,
} from "~/lib/services";
import { PERMIT_STATUS_LABELS, USER_ROLE_LABELS, CONSTRUCTION_TYPES, type UserRole } from "~/lib/utils";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { Permit, PermitHistory, Worker, ConstructionTeam, ConstructionArea } from "~/lib/types";
import { getAreas, checkAreaConflict } from "~/lib/services";

export const loader = async ({ params }: { params: { id: string } }) => {
  const id = parseInt(params.id);
  const permit = await getPermitById(id);
  if (!permit) {
    throw new Response("Not Found", { status: 404 });
  }

  const [histories, workers, team, area, areas] = await Promise.all([
    getPermitHistories(id),
    getPermitWorkers(id),
    getTeamById(permit.teamId),
    getAreaById(permit.areaId),
    getAreas(),
  ]);

  return { permit, histories, workers, team, area, areas };
};

export const action = async ({ request, params }: { request: Request; params: { id: string } }) => {
  const id = parseInt(params.id);
  const formData = await request.formData();
  const actionType = formData.get("action") as string;

  switch (actionType) {
    case "confirmArea":
      await confirmArea(id);
      break;
    case "markAreaConflict":
      await markAreaConflict(id, formData.get("conflictDetail") as string);
      break;
    case "confirmSafety":
      await confirmSafety(id);
      break;
    case "rejectSafety":
      await rejectSafety(id, formData.get("rejectReason") as string);
      break;
    case "resubmitSafety":
      await resubmitSafety(id);
      break;
    case "supplyDocuments":
      await supplyDocuments(id);
      break;
    case "checkIn":
      await checkIn(id);
      break;
    case "checkOut":
      await checkOut(id);
      break;
    case "updateAreaAndResubmit":
      await updateAreaAndResubmit(
        id,
        parseInt(formData.get("areaId") as string),
        formData.get("startDate") as string,
        formData.get("endDate") as string
      );
      break;
  }

  return redirect(`/permits/${id}`);
};

export default function PermitDetail() {
  const { permit, histories, workers, team, area, areas } = useLoaderData<typeof loader>();
  const { currentRole } = useOutletContext<{ currentRole: UserRole }>();
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [conflictDetail, setConflictDetail] = useState(permit.areaConflictDetail || "");
  const [rescheduleAreaId, setRescheduleAreaId] = useState(String(permit.areaId));
  const [rescheduleStartDate, setRescheduleStartDate] = useState(permit.startDate);
  const [rescheduleEndDate, setRescheduleEndDate] = useState(permit.endDate);
  const [conflictCheckResult, setConflictCheckResult] = useState<{
    hasConflict: boolean;
    conflictingPermits: Permit[];
  } | null>(null);

  const checkConflict = async () => {
    const result = await checkAreaConflict(
      parseInt(rescheduleAreaId),
      rescheduleStartDate,
      rescheduleEndDate,
      permit.id
    );
    setConflictCheckResult(result);
  };

  const renderActions = () => {
    const actions: ReactNode[] = [];

    if (currentRole === "SECURITY_OFFICER") {
      if (permit.status === "PENDING_DOCUMENT") {
        actions.push(
          <Form method="post" key="supply">
            <input type="hidden" name="action" value="supplyDocuments" />
            <button type="submit" className="btn-success">
              ✅ 证件已补齐
            </button>
          </Form>
        );
      }
      if (permit.status === "APPROVED") {
        actions.push(
          <Form method="post" key="checkin">
            <input type="hidden" name="action" value="checkIn" />
            <button type="submit" className="btn-success">
              🚪 入园登记
            </button>
          </Form>
        );
      }
      if (permit.status === "IN_PROGRESS") {
        actions.push(
          <Form method="post" key="checkout">
            <input type="hidden" name="action" value="checkOut" />
            <button type="submit" className="btn-warning">
              🏁 离场核销
            </button>
          </Form>
        );
      }
      if (permit.status === "AREA_CONFLICT") {
        actions.push(
          <button
            key="reschedule"
            className="btn-primary"
            onClick={() => setShowRescheduleModal(true)}
          >
            🔄 调整重提
          </button>
        );
      }
      if (permit.status === "SAFETY_BRIEFING_REJECTED") {
        actions.push(
          <Form method="post" key="resubmit">
            <input type="hidden" name="action" value="resubmitSafety" />
            <button type="submit" className="btn-primary">
              📤 重新提交
            </button>
          </Form>
        );
      }
    }

    if (currentRole === "ENGINEERING_MANAGER") {
      if (permit.status === "PENDING_AREA_CONFIRM") {
        actions.push(
          <Form method="post" key="confirm-area">
            <input type="hidden" name="action" value="confirmArea" />
            <button type="submit" className="btn-success mr-2">
              ✅ 确认区域
            </button>
          </Form>
        );
        actions.push(
          <button
            key="mark-conflict"
            className="btn-danger"
            onClick={() => setShowConflictModal(true)}
          >
            ⚠️ 标记冲突
          </button>
        );
      }
    }

    if (currentRole === "SAFETY_REVIEWER") {
      if (permit.status === "PENDING_SAFETY_BRIEFING") {
        actions.push(
          <Form method="post" key="confirm-safety">
            <input type="hidden" name="action" value="confirmSafety" />
            <button type="submit" className="btn-success mr-2">
              ✅ 交底通过
            </button>
          </Form>
        );
        actions.push(
          <button
            key="reject-safety"
            className="btn-danger"
            onClick={() => setShowRejectModal(true)}
          >
            ❌ 退回
          </button>
        );
      }
    }

    return actions;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/permits")}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← 返回列表
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{permit.permitNumber}</h1>
              <StatusBadge status={permit.status} />
              <ConstructionTypeBadge type={permit.constructionType} />
            </div>
            <p className="text-slate-500 mt-1">{permit.workContent}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">{renderActions()}</div>
      </div>

      {permit.anomalyType && permit.anomalyType !== "NONE" && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-danger-800">异常提醒</h3>
            <p className="text-danger-700 text-sm mt-1">{permit.anomalyReason || permit.anomalyType}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span>👷</span>施工队信息
            </h2>
            {team && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="施工队名称" value={team.name} />
                  <InfoItem label="所属公司" value={team.company} />
                  <InfoItem label="负责人" value={team.leaderName} />
                  <InfoItem label="联系电话" value={team.leaderPhone} />
                  <InfoItem
                    label="资质证号"
                    value={team.licenseNumber || "未提供"}
                    highlight={!team.licenseNumber}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span>👥</span>施工人员 ({workers.length}人)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 text-sm font-medium text-slate-500">姓名</th>
                    <th className="text-left py-3 text-sm font-medium text-slate-500">身份证号</th>
                    <th className="text-left py-3 text-sm font-medium text-slate-500">联系电话</th>
                    <th className="text-left py-3 text-sm font-medium text-slate-500">安全证</th>
                    <th className="text-left py-3 text-sm font-medium text-slate-500">证号</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-slate-50">
                      <td className="py-3 text-sm text-slate-900 font-medium">{worker.name}</td>
                      <td className="py-3 text-sm text-slate-600">{worker.idCard}</td>
                      <td className="py-3 text-sm text-slate-600">{worker.phone || "-"}</td>
                      <td className="py-3">
                        {worker.hasSafetyCert ? (
                          <span className="badge-success">有</span>
                        ) : (
                          <span className="badge-danger">无</span>
                        )}
                      </td>
                      <td className="py-3 text-sm text-slate-600">
                        {worker.certNumber || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span>📎</span>证件资料
            </h2>
            {permit.hasDocuments ? (
              <div className="flex items-center gap-2 text-success-600">
                <span>✅</span>
                <span>证件齐全</span>
              </div>
            ) : (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h3 className="font-medium text-warning-800">证件缺失</h3>
                    <p className="text-warning-700 text-sm mt-1">
                      {permit.documentMissingReason || "需要补充相关证件"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {permit.safetyBriefingStatus === "COMPLETED" && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span>📸</span>安全交底证据
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {permit.safetyBriefingEvidence?.map((ev, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video bg-slate-100 flex items-center justify-center">
                      <span className="text-4xl">
                        {ev.type === "photo" ? "🖼️" : "📄"}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-slate-700">{ev.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{ev.type === "photo" ? "照片" : "文档"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {permit.status === "SAFETY_BRIEFING_REJECTED" && permit.safetyRejectReason && (
            <div className="card p-6 border-danger-200 bg-danger-50">
              <h2 className="text-lg font-semibold text-danger-800 mb-2 flex items-center gap-2">
                <span>❌</span>安全交底退回原因
              </h2>
              <p className="text-danger-700">{permit.safetyRejectReason}</p>
            </div>
          )}

          {permit.hasAreaConflict && permit.areaConflictDetail && (
            <div className="card p-6 border-warning-200 bg-warning-50">
              <h2 className="text-lg font-semibold text-warning-800 mb-2 flex items-center gap-2">
                <span>⚠️</span>区域冲突详情
              </h2>
              <p className="text-warning-700">{permit.areaConflictDetail}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span>📍</span>施工区域
            </h2>
            {area && (
              <div className="space-y-3">
                <div className="bg-primary-50 rounded-lg p-4">
                  <p className="font-semibold text-primary-900 text-lg">{area.name}</p>
                  <p className="text-primary-600 text-sm">{area.code}</p>
                </div>
                <InfoItem label="楼栋" value={area.building || "-"} />
                <InfoItem label="楼层" value={area.floor || "-"} />
                <InfoItem label="容量" value={`${area.capacity}人`} />
                {area.description && (
                  <InfoItem label="说明" value={area.description} />
                )}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span>🕐</span>时间安排
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="开始日期" value={format(parseISO(permit.startDate), "yyyy年MM月dd日", { locale: zhCN })} />
                <InfoItem label="结束日期" value={format(parseISO(permit.endDate), "yyyy年MM月dd日", { locale: zhCN })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="每日开始" value={permit.startTime.slice(0, 5)} />
                <InfoItem label="每日结束" value={permit.endTime.slice(0, 5)} />
              </div>
            </div>
          </div>

          {permit.actualCheckIn && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span>📝</span>实际记录
              </h2>
              <div className="space-y-3">
                <InfoItem
                  label="实际入园"
                  value={format(parseISO(permit.actualCheckIn), "MM-dd HH:mm", { locale: zhCN })}
                />
                {permit.actualCheckOut ? (
                  <InfoItem
                    label="实际离场"
                    value={format(parseISO(permit.actualCheckOut), "MM-dd HH:mm", { locale: zhCN })}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-success-600">
                    <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></span>
                    <span className="text-sm font-medium">施工进行中</span>
                  </div>
                )}
                {permit.stayDurationHours && (
                  <InfoItem label="实际滞留" value={`${permit.stayDurationHours}小时`} />
                )}
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span>📋</span>审批流程
            </h2>
            <div className="space-y-3">
              <ProcessStep
                icon="📝"
                title="创建申请"
                completed={true}
                role="安保经办人"
              />
              <ProcessStep
                icon="📄"
                title="证件审核"
                completed={permit.hasDocuments}
                role="安保经办人"
                warning={!permit.hasDocuments}
              />
              <ProcessStep
                icon="📍"
                title="区域确认"
                completed={
                  permit.status !== "DRAFT" &&
                  permit.status !== "PENDING_DOCUMENT" &&
                  permit.status !== "PENDING_AREA_CONFIRM" &&
                  permit.status !== "AREA_CONFLICT"
                }
                active={permit.status === "PENDING_AREA_CONFIRM"}
                warning={permit.status === "AREA_CONFLICT"}
                role="工程负责人"
              />
              <ProcessStep
                icon="🛡️"
                title="安全交底"
                completed={
                  permit.status === "APPROVED" ||
                  permit.status === "IN_PROGRESS" ||
                  permit.status === "COMPLETED"
                }
                active={permit.status === "PENDING_SAFETY_BRIEFING"}
                warning={permit.status === "SAFETY_BRIEFING_REJECTED"}
                role="安全复核人"
              />
              <ProcessStep
                icon="✅"
                title="许可批准"
                completed={
                  permit.status === "APPROVED" ||
                  permit.status === "IN_PROGRESS" ||
                  permit.status === "COMPLETED"
                }
              />
              <ProcessStep
                icon="🚪"
                title="入场施工"
                completed={permit.status === "IN_PROGRESS" || permit.status === "COMPLETED"}
                active={permit.status === "IN_PROGRESS"}
              />
              <ProcessStep
                icon="🏁"
                title="离场核销"
                completed={permit.status === "COMPLETED"}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span>📜</span>历史记录
        </h2>
        <div className="space-y-4">
          {histories.map((history, index) => (
            <div key={history.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    index === 0
                      ? "bg-primary-100 ring-4 ring-primary-50 ring-offset-0"
                      : "bg-slate-100"
                  }`}
                >
                  {getHistoryIcon(history.action)}
                </div>
                {index < histories.length - 1 && (
                  <div className="w-0.5 flex-1 bg-slate-200 mt-1"></div>
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">
                    {getHistoryActionLabel(history.action)}
                  </span>
                  {history.statusFrom && history.statusTo && (
                    <span className="text-sm text-slate-500">
                      {PERMIT_STATUS_LABELS[history.statusFrom as keyof typeof PERMIT_STATUS_LABELS] || history.statusFrom}{" "}
                      →{" "}
                      {PERMIT_STATUS_LABELS[history.statusTo as keyof typeof PERMIT_STATUS_LABELS] || history.statusTo}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                  <span>{history.operatorName}</span>
                  <span>·</span>
                  <span>{USER_ROLE_LABELS[history.operatorRole as keyof typeof USER_ROLE_LABELS] || history.operatorRole}</span>
                  <span>·</span>
                  <span>{format(parseISO(history.createdAt), "MM-dd HH:mm", { locale: zhCN })}</span>
                </div>
                {history.remark && (
                  <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-lg p-3">
                    {history.remark}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showRejectModal && (
        <Modal title="安全交底退回" onClose={() => setShowRejectModal(false)}>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="action" value="rejectSafety" />
            <div>
              <label className="label">退回原因</label>
              <textarea
                name="rejectReason"
                className="input h-32"
                placeholder="请详细说明退回原因..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowRejectModal(false)}
              >
                取消
              </button>
              <button type="submit" className="btn-danger">
                确认退回
              </button>
            </div>
          </Form>
        </Modal>
      )}

      {showConflictModal && (
        <Modal title="标记区域冲突" onClose={() => setShowConflictModal(false)}>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="action" value="markAreaConflict" />
            <div>
              <label className="label">冲突详情</label>
              <textarea
                name="conflictDetail"
                className="input h-32"
                placeholder="请详细说明区域冲突情况..."
                value={conflictDetail}
                onChange={(e) => setConflictDetail(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowConflictModal(false)}
              >
                取消
              </button>
              <button type="submit" className="btn-danger">
                确认标记
              </button>
            </div>
          </Form>
        </Modal>
      )}

      {showRescheduleModal && (
        <Modal
          title="调整施工区域/时间"
          onClose={() => setShowRescheduleModal(false)}
          size="lg"
        >
          <Form method="post" className="space-y-4">
            <input type="hidden" name="action" value="updateAreaAndResubmit" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">施工区域</label>
                <select
                  name="areaId"
                  className="input"
                  value={rescheduleAreaId}
                  onChange={(e) => {
                    setRescheduleAreaId(e.target.value);
                    setConflictCheckResult(null);
                  }}
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div></div>
              <div>
                <label className="label">开始日期</label>
                <input
                  type="date"
                  name="startDate"
                  className="input"
                  value={rescheduleStartDate}
                  onChange={(e) => {
                    setRescheduleStartDate(e.target.value);
                    setConflictCheckResult(null);
                  }}
                />
              </div>
              <div>
                <label className="label">结束日期</label>
                <input
                  type="date"
                  name="endDate"
                  className="input"
                  value={rescheduleEndDate}
                  onChange={(e) => {
                    setRescheduleEndDate(e.target.value);
                    setConflictCheckResult(null);
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn-secondary w-full"
              onClick={checkConflict}
            >
              🔍 检测区域冲突
            </button>

            {conflictCheckResult && (
              <div
                className={`rounded-lg p-4 ${
                  conflictCheckResult.hasConflict
                    ? "bg-danger-50 border border-danger-200"
                    : "bg-success-50 border border-success-200"
                }`}
              >
                {conflictCheckResult.hasConflict ? (
                  <div>
                    <p className="font-medium text-danger-800 flex items-center gap-2">
                      <span>⚠️</span>检测到区域冲突
                    </p>
                    <p className="text-sm text-danger-700 mt-2">
                      该时间段已有 {conflictCheckResult.conflictingPermits.length} 个施工许可
                    </p>
                  </div>
                ) : (
                  <p className="font-medium text-success-800 flex items-center gap-2">
                    <span>✅</span>该区域该时间段可用
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowRescheduleModal(false)}
              >
                取消
              </button>
              <button type="submit" className="btn-primary">
                确认调整并重提
              </button>
            </div>
          </Form>
        </Modal>
      )}
    </div>
  );
}

function InfoItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p
        className={`text-sm font-medium ${
          highlight ? "text-danger-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ProcessStep({
  icon,
  title,
  completed,
  active,
  warning,
  role,
}: {
  icon: string;
  title: string;
  completed?: boolean;
  active?: boolean;
  warning?: boolean;
  role?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${
          completed
            ? "bg-success-100"
            : active
            ? "bg-primary-100 ring-2 ring-primary-300 ring-offset-2"
            : warning
            ? "bg-warning-100"
            : "bg-slate-100"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            completed
              ? "text-success-700"
              : active
              ? "text-primary-700"
              : warning
              ? "text-warning-700"
              : "text-slate-500"
          }`}
        >
          {title}
        </p>
        {role && <p className="text-xs text-slate-400">{role}</p>}
      </div>
      {completed && <span className="text-success-500">✓</span>}
      {active && <span className="text-primary-500 text-xs">进行中</span>}
      {warning && <span className="text-warning-500 text-xs">异常</span>}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
  size = "md",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} animate-slide-up`}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function getHistoryIcon(action: string) {
  const icons: Record<string, string> = {
    CREATE: "📝",
    SUBMIT: "📤",
    CONFIRM_AREA: "📍",
    AREA_CONFLICT: "⚠️",
    CONFIRM_SAFETY: "🛡️",
    REJECT_SAFETY: "❌",
    REJECT_DOCUMENT: "📄",
    SUPPLY_DOCUMENTS: "✅",
    RESUBMIT_SAFETY: "📤",
    RESUBMIT_AREA: "🔄",
    CHECK_IN: "🚪",
    CHECK_OUT: "🏁",
  };
  return icons[action] || "📋";
}

function getHistoryActionLabel(action: string) {
  const labels: Record<string, string> = {
    CREATE: "创建申请",
    SUBMIT: "提交审核",
    CONFIRM_AREA: "区域确认通过",
    AREA_CONFLICT: "标记区域冲突",
    CONFIRM_SAFETY: "安全交底通过",
    REJECT_SAFETY: "安全交底退回",
    REJECT_DOCUMENT: "证件审核不通过",
    SUPPLY_DOCUMENTS: "证件已补齐",
    RESUBMIT_SAFETY: "重新提交安全审核",
    RESUBMIT_AREA: "调整后重新提交",
    CHECK_IN: "入园登记",
    CHECK_OUT: "离场核销",
  };
  return labels[action] || action;
}
