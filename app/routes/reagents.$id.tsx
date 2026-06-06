import { json, type LoaderFunctionArgs, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { getReagentById, getRequisitionsByRequester, createRequisition, generateRequisitionNo, createOperationLog, getUserById, getUsersByRoleAndLevel } from "~/db/queries";
import { getHazardLevelName, getPermissionLevelName, checkPermission } from "~/utils/permissions";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = parseInt(params.id || "0");
  const reagent = await getReagentById(id);
  
  if (!reagent) {
    throw new Response("Not Found", { status: 404 });
  }
  
  const url = new URL(request.url);
  const currentUserId = parseInt(url.searchParams.get("userId") || "1");
  const currentUser = await getUserById(currentUserId);
  
  const permissionCheck = checkPermission(
    currentUser?.permissionLevel || 1,
    reagent.requiredPermissionLevel
  );
  
  return json({ 
    reagent, 
    currentUser, 
    permissionCheck,
    currentUserId 
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const reagentId = parseInt(formData.get("reagentId") as string);
  const requesterId = parseInt(formData.get("requesterId") as string);
  const purpose = formData.get("purpose") as string;
  const quantity = parseFloat(formData.get("quantity") as string);
  const expectedReturnDate = formData.get("expectedReturnDate") as string;
  
  const reagent = await getReagentById(reagentId);
  const user = await getUserById(requesterId);
  
  if (!reagent || !user) {
    return json({ error: "试剂或用户不存在" }, { status: 400 });
  }
  
  if (quantity > reagent.remainingQuantity) {
    return json({ error: `库存不足。当前库存: ${reagent.remainingQuantity} ${reagent.unit}` }, { status: 400 });
  }
  
  const permissionCheck = checkPermission(user.permissionLevel, reagent.requiredPermissionLevel);
  const requisitionNo = await generateRequisitionNo();
  
  let status: any = "pending";
  let escalatedToId: number | undefined = undefined;
  
  if (!permissionCheck.allowed) {
    status = "escalated";
    const higherLevelOfficers = await getUsersByRoleAndLevel("safety_officer", reagent.requiredPermissionLevel);
    if (higherLevelOfficers.length > 0) {
      escalatedToId = higherLevelOfficers[0].id;
    }
  }
  
  const requisition = await createRequisition({
    requisitionNo,
    reagentId,
    requesterId,
    purpose,
    quantity,
    expectedReturnDate: new Date(expectedReturnDate),
    status,
    escalatedToId,
  });
  
  await createOperationLog({
    requisitionId: requisition.id,
    reagentId,
    userId: requesterId,
    action: "create_requisition",
    details: `提交${reagent.name}领用申请，数量${quantity}${reagent.unit}${!permissionCheck.allowed ? "（已升级审批）" : ""}`,
  });
  
  return redirect(`/requisitions/${requisition.id}?userId=${requesterId}`);
}

export default function ReagentDetail() {
  const { reagent, currentUser, permissionCheck, currentUserId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const hazardInfo = getHazardLevelName(reagent.hazardLevel);
  const stockPercent = (reagent.remainingQuantity / reagent.totalQuantity) * 100;
  
  const today = new Date().toISOString().split("T")[0];
  const defaultReturnDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <a href={`/?userId=${currentUserId}`} className="btn btn-outline btn-sm">
          ← 返回列表
        </a>
        <h1 className="page-title" style={{ margin: 0 }}>试剂详情</h1>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 className="card-title">基本信息</h2>
          <div className="detail-row">
            <span className="detail-label">试剂编号</span>
            <span className="detail-value font-semibold">{reagent.reagentCode}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">试剂名称</span>
            <span className="detail-value font-bold text-lg">{reagent.name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">类别</span>
            <span className="detail-value">{reagent.category}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">危险等级</span>
            <span className="detail-value">
              <span className={`badge badge-${getBadgeColor(reagent.hazardLevel)}`}>
                {hazardInfo.label}
              </span>
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">所需权限等级</span>
            <span className="detail-value">
              Lv.{reagent.requiredPermissionLevel}
              <span className="text-muted text-sm ml-2">
                ({getPermissionLevelName(reagent.requiredPermissionLevel)})
              </span>
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">生产厂家</span>
            <span className="detail-value">{reagent.manufacturer || "-"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">存放位置</span>
            <span className="detail-value">{reagent.location || "-"}</span>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">库存信息</h2>
          <div className="detail-row">
            <span className="detail-label">总库存</span>
            <span className="detail-value">{reagent.totalQuantity} {reagent.unit}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">剩余量</span>
            <span className="detail-value">
              <span className={stockPercent < 20 ? "text-danger font-bold" : "font-bold"} style={{ color: stockPercent < 20 ? "#ef4444" : "inherit" }}>
                {reagent.remainingQuantity} {reagent.unit}
              </span>
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">库存状态</span>
            <span className="detail-value">
              {stockPercent < 20 ? (
                <span className="badge badge-red">库存不足</span>
              ) : stockPercent < 50 ? (
                <span className="badge badge-yellow">库存偏低</span>
              ) : (
                <span className="badge badge-green">库存充足</span>
              )}
            </span>
          </div>
          
          <div style={{ marginTop: "1rem" }}>
            <div style={{ 
              width: "100%", 
              height: "12px", 
              background: "#e2e8f0", 
              borderRadius: "6px",
              overflow: "hidden"
            }}>
              <div 
                style={{ 
                  width: `${Math.max(stockPercent, 2)}%`, 
                  height: "100%", 
                  background: stockPercent < 20 ? "#ef4444" : stockPercent < 50 ? "#f59e0b" : "#22c55e",
                  borderRadius: "6px",
                  transition: "width 0.3s"
                }}
              />
            </div>
            <div className="text-xs text-muted mt-2 text-right">
              {stockPercent.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">试剂描述</h2>
        <p className="text-muted">{reagent.description || "暂无描述"}</p>
      </div>

      <div className="card">
        <h2 className="card-title">领用申请</h2>
        
        {!permissionCheck.allowed && (
          <div className="alert alert-danger mb-4">
            <div className="font-semibold mb-2">⚠️ 权限等级不足</div>
            <p className="text-sm mb-2">{permissionCheck.reason}</p>
            <p className="text-sm">
              <strong>升级审批路径：</strong>
              该试剂需要 Lv.{permissionCheck.requiredLevel} 权限，您当前为 Lv.{permissionCheck.currentLevel}。
              您的申请将自动升级至更高权限等级的安全员进行审批。
            </p>
          </div>
        )}
        
        {reagent.remainingQuantity <= 0 && (
          <div className="alert alert-warning mb-4">
            <strong>库存不足！</strong> 当前无可用库存，请等待补货。
          </div>
        )}

        {actionData?.error && (
          <div className="alert alert-danger mb-4">
            {actionData.error}
          </div>
        )}

        <Form method="post">
          <input type="hidden" name="reagentId" value={reagent.id} />
          <input type="hidden" name="requesterId" value={currentUserId} />
          
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">申请人</label>
              <div className="form-input" style={{ background: "#f8fafc" }}>
                {currentUser?.name}（{currentUser?.college}）
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">申请数量</label>
              <input 
                type="number" 
                name="quantity" 
                className="form-input"
                min="0"
                step="0.01"
                max={reagent.remainingQuantity}
                defaultValue={Math.min(100, reagent.remainingQuantity)}
                required
              />
              <div className="text-xs text-muted mt-1">
                单位: {reagent.unit}，剩余可用: {reagent.remainingQuantity} {reagent.unit}
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">用途说明</label>
            <textarea 
              name="purpose" 
              className="form-textarea"
              placeholder="请详细说明试剂的使用用途、实验项目等..."
              rows={3}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">预计归还日期</label>
            <input 
              type="date" 
              name="expectedReturnDate" 
              className="form-input"
              min={today}
              defaultValue={defaultReturnDate}
              required
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <a href={`/?userId=${currentUserId}`} className="btn btn-outline">
              取消
            </a>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={reagent.remainingQuantity <= 0}
            >
              {!permissionCheck.allowed ? "提交申请（需升级审批）" : "提交领用申请"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
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
