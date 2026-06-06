import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { 
  getRequisitionWithDetails, 
  updateRequisitionStatus, 
  createOperationLog,
  updateReagentRemainingQuantity,
  createReturn,
  getUsersByMinPermissionLevel,
  getUserById
} from "~/db/queries";
import { getHazardLevelName, getStatusInfo, getPermissionLevelName, checkPermission, getRoleName } from "~/utils/permissions";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = parseInt(params.id || "0");
  const url = new URL(request.url);
  const currentUserId = parseInt(url.searchParams.get("userId") || "1");
  
  const details = await getRequisitionWithDetails(id);
  
  if (!details) {
    throw new Response("Not Found", { status: 404 });
  }
  
  const currentUser = await getUserById(currentUserId);
  
  return json({ details, currentUserId, currentUser });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const id = parseInt(params.id || "0");
  const formData = await request.formData();
  const action = formData.get("_action") as string;
  const userId = parseInt(formData.get("userId") as string);
  const comment = formData.get("comment") as string;
  
  const details = await getRequisitionWithDetails(id);
  if (!details) {
    return json({ error: "领用单不存在" }, { status: 404 });
  }

  switch (action) {
    case "lab_approve": {
      const permissionCheck = checkPermission(
        details.requester?.permissionLevel || 1,
        details.reagent?.requiredPermissionLevel || 1
      );
      
      if (!permissionCheck.allowed) {
        const escalatedUsers = await getUsersByMinPermissionLevel(
          details.reagent?.requiredPermissionLevel || 1
        );
        const safetyOfficers = escalatedUsers.filter(u => u.role === "safety_officer");
        const escalateTo = safetyOfficers.length > 0 ? safetyOfficers[0] : escalatedUsers[0];
        
        await updateRequisitionStatus(id, "escalated", {
          labAdminId: userId,
          labAdminComment: comment || "库存充足，但申请人权限等级不足，需升级审批",
          escalatedToId: escalateTo?.id,
        });
        
        await createOperationLog({
          requisitionId: id,
          reagentId: details.reagent?.id,
          userId,
          action: "escalate",
          details: `权限等级不足，升级至${escalateTo?.name}审批`,
        });
        
        return redirect(`/requisitions/${id}?userId=${userId}`);
      }
      
      if (details.reagent && details.requisition.quantity > details.reagent.remainingQuantity) {
        await updateRequisitionStatus(id, "lab_rejected", {
          labAdminId: userId,
          labAdminComment: comment || `库存不足，剩余${details.reagent.remainingQuantity}${details.reagent.unit}`,
        });
        
        await createOperationLog({
          requisitionId: id,
          reagentId: details.reagent.id,
          userId,
          action: "lab_reject",
          details: `拒绝：库存不足`,
        });
        
        return redirect(`/requisitions/${id}?userId=${userId}`);
      }
      
      await updateRequisitionStatus(id, "lab_approved", {
        labAdminId: userId,
        labAdminComment: comment || "库存充足，核验通过",
      });
      
      await createOperationLog({
        requisitionId: id,
        reagentId: details.reagent?.id,
        userId,
        action: "lab_approve",
        details: "实验室管理员审批通过，核验库存",
      });
      
      return redirect(`/requisitions/${id}?userId=${userId}`);
    }
    
    case "lab_reject": {
      await updateRequisitionStatus(id, "lab_rejected", {
        labAdminId: userId,
        labAdminComment: comment || "实验室管理员拒绝",
      });
      
      await createOperationLog({
        requisitionId: id,
        reagentId: details.reagent?.id,
        userId,
        action: "lab_reject",
        details: `拒绝：${comment || "实验室管理员拒绝"}`,
      });
      
      return redirect(`/requisitions/${id}?userId=${userId}`);
    }
    
    case "safety_approve": {
      await updateRequisitionStatus(id, "safety_approved", {
        safetyOfficerId: userId,
        safetyOfficerComment: comment || "安全员审批通过",
      });
      
      await createOperationLog({
        requisitionId: id,
        reagentId: details.reagent?.id,
        userId,
        action: "safety_approve",
        details: "安全员审批通过",
      });
      
      return redirect(`/requisitions/${id}?userId=${userId}`);
    }
    
    case "safety_reject": {
      await updateRequisitionStatus(id, "safety_rejected", {
        safetyOfficerId: userId,
        safetyOfficerComment: comment || "安全员拒绝",
      });
      
      await createOperationLog({
        requisitionId: id,
        reagentId: details.reagent?.id,
        userId,
        action: "safety_reject",
        details: `拒绝：${comment || "安全员拒绝"}`,
      });
      
      return redirect(`/requisitions/${id}?userId=${userId}`);
    }
    
    case "pick_up": {
      await updateRequisitionStatus(id, "picked_up", {
        pickedUpAt: new Date(),
      });
      
      if (details.reagent) {
        await updateReagentRemainingQuantity(details.reagent.id, -details.requisition.quantity);
      }
      
      await createOperationLog({
        requisitionId: id,
        reagentId: details.reagent?.id,
        userId,
        action: "pick_up",
        details: `已领取${details.reagent?.name} ${details.requisition.quantity}${details.reagent?.unit}`,
      });
      
      return redirect(`/requisitions/${id}?userId=${userId}`);
    }
    
    case "return": {
      const returnedQuantity = parseFloat(formData.get("returnedQuantity") as string);
      const condition = formData.get("condition") as "good" | "partial" | "empty" | "contaminated";
      const notes = formData.get("notes") as string;
      
      await createReturn({
        requisitionId: id,
        returnedQuantity,
        condition,
        verifierId: userId,
        notes,
      });
      
      await updateRequisitionStatus(id, "returned", {
        returnedAt: new Date(),
      });
      
      if (details.reagent) {
        await updateReagentRemainingQuantity(details.reagent.id, returnedQuantity);
      }
      
      await createOperationLog({
        requisitionId: id,
        reagentId: details.reagent?.id,
        userId,
        action: "return_reagent",
        details: `归还${returnedQuantity}${details.reagent?.unit}，状态：${condition}`,
      });
      
      return redirect(`/requisitions/${id}?userId=${userId}`);
    }
    
    default:
      return json({ error: "未知操作" }, { status: 400 });
  }
}

export default function RequisitionDetail() {
  const { details, currentUserId, currentUser } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  const { requisition, reagent, requester, labAdmin, safetyOfficer, escalatedTo, returns, logs } = details;
  const statusInfo = getStatusInfo(requisition.status);
  const hazardInfo = reagent ? getHazardLevelName(reagent.hazardLevel) : { label: "-", color: "" };
  
  const canLabApprove = currentUser?.role === "lab_admin" && requisition.status === "pending";
  const canSafetyApprove = currentUser?.role === "safety_officer" && requisition.status === "lab_approved";
  const canEscalatedApprove = requisition.status === "escalated" && requisition.escalatedToId === currentUserId;
  const canPickUp = requisition.status === "safety_approved";
  const canReturn = requisition.status === "picked_up";
  const isOverdue = requisition.status === "overdue";

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <a href={`/requisitions?userId=${currentUserId}`} className="btn btn-outline btn-sm">
          ← 返回列表
        </a>
        <h1 className="page-title" style={{ margin: 0 }}>领用申请详情</h1>
        <span className={`badge badge-${getStatusBadgeColor(requisition.status)}`} style={{ marginLeft: "auto" }}>
          {statusInfo.label}
        </span>
      </div>

      {isOverdue && (
        <div className="alert alert-danger mb-6">
          ⚠️ 该领用已逾期！预计归还日期为 {formatDate(requisition.expectedReturnDate)}，请尽快归还。
        </div>
      )}
      
      {requisition.status === "escalated" && (
        <div className="alert alert-warning mb-6">
          ⚠️ 该申请因权限等级不足已升级审批，当前由 <strong>{escalatedTo?.name}</strong>（{getPermissionLevelName(escalatedTo?.permissionLevel || 1)}）负责审批。
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <h2 className="section-title">试剂信息</h2>
          <div className="detail-row">
            <span className="detail-label">试剂编号</span>
            <span className="detail-value font-semibold">{reagent?.reagentCode}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">试剂名称</span>
            <span className="detail-value font-bold">{reagent?.name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">危险等级</span>
            <span className="detail-value">
              <span className={`badge badge-${getBadgeColor(reagent?.hazardLevel || "")}`}>
                {hazardInfo.label}
              </span>
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">所需权限</span>
            <span className="detail-value">
              Lv.{reagent?.requiredPermissionLevel}
              <span className="text-muted text-sm ml-2">
                ({getPermissionLevelName(reagent?.requiredPermissionLevel || 1)})
              </span>
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">剩余库存</span>
            <span className="detail-value">
              {reagent?.remainingQuantity} {reagent?.unit}
              <span className="text-muted text-sm ml-2">
                / 总库存 {reagent?.totalQuantity} {reagent?.unit}
              </span>
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">存放位置</span>
            <span className="detail-value">{reagent?.location || "-"}</span>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">领用信息</h2>
          <div className="detail-row">
            <span className="detail-label">申请单号</span>
            <span className="detail-value font-semibold">{requisition.requisitionNo}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">领用人</span>
            <span className="detail-value">
              {requester?.name}
              <span className="text-muted text-sm ml-2">
                ({requester?.college} · {getRoleName(requester?.role || "")})
              </span>
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">申请人权限</span>
            <span className="detail-value">
              Lv.{requester?.permissionLevel}
              <span className="text-muted text-sm ml-2">
                ({getPermissionLevelName(requester?.permissionLevel || 1)})
              </span>
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">申请数量</span>
            <span className="detail-value font-semibold">
              {requisition.quantity} {reagent?.unit}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">预计归还日期</span>
            <span className="detail-value">{formatDate(requisition.expectedReturnDate)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">申请时间</span>
            <span className="detail-value text-muted text-sm">
              {formatDateTime(requisition.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">用途说明</h2>
        <p className="text-muted">{requisition.purpose}</p>
      </div>

      <div className="grid grid-2">
        {labAdmin && (
          <div className="card">
            <h2 className="section-title">实验室管理员审批</h2>
            <div className="detail-row">
              <span className="detail-label">审批人</span>
              <span className="detail-value">{labAdmin.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">审批意见</span>
              <span className="detail-value">{requisition.labAdminComment || "-"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">审批时间</span>
              <span className="detail-value text-muted text-sm">
                {requisition.updatedAt ? formatDateTime(requisition.updatedAt) : "-"}
              </span>
            </div>
          </div>
        )}

        {safetyOfficer && (
          <div className="card">
            <h2 className="section-title">安全员审批</h2>
            <div className="detail-row">
              <span className="detail-label">审批人</span>
              <span className="detail-value">{safetyOfficer.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">审批意见</span>
              <span className="detail-value">{requisition.safetyOfficerComment || "-"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">审批时间</span>
              <span className="detail-value text-muted text-sm">
                {requisition.updatedAt ? formatDateTime(requisition.updatedAt) : "-"}
              </span>
            </div>
          </div>
        )}
      </div>

      {returns && returns.length > 0 && (
        <div className="card">
          <h2 className="section-title">归还记录</h2>
          <table className="table">
            <thead>
              <tr>
                <th>归还时间</th>
                <th>归还数量</th>
                <th>状态</th>
                <th>核验人</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((ret) => (
                <tr key={ret.id}>
                  <td className="text-sm">{formatDateTime(ret.createdAt)}</td>
                  <td>{ret.returnedQuantity} {reagent?.unit}</td>
                  <td>
                    <span className={`badge badge-${getConditionBadge(ret.condition)}`}>
                      {getConditionLabel(ret.condition)}
                    </span>
                  </td>
                  <td className="text-sm">-</td>
                  <td className="text-sm text-muted">{ret.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h2 className="section-title">操作历史</h2>
        <div>
          {logs.map((log) => (
            <div key={log.id} className="log-item">
              <div className="log-header">
                <span className="log-action">{getActionLabel(log.action)}</span>
                <span className="log-time">{formatDateTime(log.createdAt)}</span>
              </div>
              <div className="log-details">
                {log.user_name} · {log.details}
              </div>
            </div>
          ))}
        </div>
      </div>

      {(canLabApprove || canSafetyApprove || canEscalatedApprove || canPickUp || canReturn) && (
        <div className="card">
          <h2 className="section-title">操作</h2>
          
          {canLabApprove && (
            <div>
              <p className="text-muted mb-4">作为实验室管理员，您可以核验库存并审批此申请。</p>
              <Form method="post">
                <input type="hidden" name="userId" value={currentUserId} />
                <div className="form-group">
                  <label className="form-label">审批意见</label>
                  <textarea name="comment" className="form-textarea" placeholder="请输入审批意见（可选）" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="submit" name="_action" value="lab_reject" className="btn btn-danger">
                    拒绝
                  </button>
                  <button type="submit" name="_action" value="lab_approve" className="btn btn-primary">
                    通过（核验库存）
                  </button>
                </div>
              </Form>
            </div>
          )}
          
          {(canSafetyApprove || canEscalatedApprove) && (
            <div>
              <p className="text-muted mb-4">
                {canEscalatedApprove 
                  ? "作为升级审批人，您可以审批此权限等级不符的申请。" 
                  : "作为安全员，您可以审批此申请。"}
              </p>
              <Form method="post">
                <input type="hidden" name="userId" value={currentUserId} />
                <div className="form-group">
                  <label className="form-label">审批意见</label>
                  <textarea name="comment" className="form-textarea" placeholder="请输入审批意见（可选）" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="submit" name="_action" value="safety_reject" className="btn btn-danger">
                    拒绝
                  </button>
                  <button type="submit" name="_action" value="safety_approve" className="btn btn-primary">
                    批准
                  </button>
                </div>
              </Form>
            </div>
          )}
          
          {canPickUp && (
            <div>
              <p className="text-muted mb-4">申请已通过审批，点击确认领取试剂。</p>
              <Form method="post">
                <input type="hidden" name="userId" value={currentUserId} />
                <div className="flex justify-end">
                  <button type="submit" name="_action" value="pick_up" className="btn btn-success">
                    确认领取
                  </button>
                </div>
              </Form>
            </div>
          )}
          
          {canReturn && (
            <div>
              <p className="text-muted mb-4">请填写归还信息进行核销。</p>
              <Form method="post">
                <input type="hidden" name="userId" value={currentUserId} />
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">归还数量 ({reagent?.unit})</label>
                    <input 
                      type="number" 
                      name="returnedQuantity" 
                      className="form-input"
                      min="0"
                      max={requisition.quantity}
                      step="0.01"
                      defaultValue={requisition.quantity}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">试剂状态</label>
                    <select name="condition" className="form-select" required>
                      <option value="good">完好</option>
                      <option value="partial">部分使用</option>
                      <option value="empty">空瓶</option>
                      <option value="contaminated">污染</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">备注</label>
                  <textarea name="notes" className="form-textarea" placeholder="请输入备注信息（可选）" />
                </div>
                <div className="flex justify-end">
                  <button type="submit" name="_action" value="return" className="btn btn-success">
                    确认归还
                  </button>
                </div>
              </Form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getBadgeColor(level: string): string {
  const map: Record<string, string> = {
    low: "green",
    medium: "yellow",
    high: "orange",
    extreme: "red",
  };
  return map[level] || "gray";
}

function getStatusBadgeColor(status: string): string {
  const map: Record<string, string> = {
    pending: "blue",
    lab_approved: "indigo",
    lab_rejected: "red",
    safety_approved: "green",
    safety_rejected: "red",
    picked_up: "purple",
    returned: "gray",
    overdue: "red",
    escalated: "orange",
  };
  return map[status] || "gray";
}

function getConditionLabel(condition: string): string {
  const map: Record<string, string> = {
    good: "完好",
    partial: "部分使用",
    empty: "空瓶",
    contaminated: "污染",
  };
  return map[condition] || condition;
}

function getConditionBadge(condition: string): string {
  const map: Record<string, string> = {
    good: "green",
    partial: "yellow",
    empty: "gray",
    contaminated: "red",
  };
  return map[condition] || "gray";
}

function getActionLabel(action: string): string {
  const map: Record<string, string> = {
    create_requisition: "📝 提交申请",
    lab_approve: "✅ 实验室审批通过",
    lab_reject: "❌ 实验室拒绝",
    safety_approve: "✅ 安全员审批通过",
    safety_reject: "❌ 安全员拒绝",
    pick_up: "📦 已领取",
    return_reagent: "↩️ 已归还",
    escalate: "⬆️ 升级审批",
  };
  return map[action] || action;
}
