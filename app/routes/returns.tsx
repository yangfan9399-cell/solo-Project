import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { 
  getReturnableRequisitions, 
  getReagentById, 
  getRequisitionById,
  getUserById,
  createReturn,
  updateRequisitionStatus,
  updateReagentRemainingQuantity,
  createOperationLog
} from "~/db/queries";
import { getStatusInfo } from "~/utils/permissions";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const userId = parseInt(url.searchParams.get("userId") || "4");
  
  const returnableReqs = await getReturnableRequisitions();
  const currentUser = await getUserById(userId);
  
  const reqsWithDetails = await Promise.all(
    returnableReqs.map(async (req) => {
      const reagent = await getReagentById(req.reagentId);
      const requester = await getUserById(req.requesterId);
      return { ...req, reagent, requester };
    })
  );
  
  const overdue = reqsWithDetails.filter(
    (req) => new Date(req.expectedReturnDate).getTime() < Date.now()
  );
  
  return json({ 
    requisitions: reqsWithDetails, 
    currentUser, 
    userId,
    overdueCount: overdue.length
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const requisitionId = parseInt(formData.get("requisitionId") as string);
  const userId = parseInt(formData.get("userId") as string);
  const returnedQuantity = parseFloat(formData.get("returnedQuantity") as string);
  const condition = formData.get("condition") as "good" | "partial" | "empty" | "contaminated";
  const notes = formData.get("notes") as string;
  
  const requisition = await getRequisitionById(requisitionId);
  const reagent = requisition ? await getReagentById(requisition.reagentId) : null;
  
  if (!requisition || !reagent) {
    return json({ error: "领用单或试剂不存在" }, { status: 404 });
  }
  
  await createReturn({
    requisitionId,
    returnedQuantity,
    condition,
    verifierId: userId,
    notes,
  });
  
  await updateRequisitionStatus(requisitionId, "returned", {
    returnedAt: new Date(),
  });
  
  await updateReagentRemainingQuantity(reagent.id, returnedQuantity);
  
  await createOperationLog({
    requisitionId,
    reagentId: reagent.id,
    userId,
    action: "return_reagent",
    details: `归还${returnedQuantity}${reagent.unit}，状态：${condition}`,
  });
  
  return redirect(`/returns?userId=${userId}`);
}

export default function Returns() {
  const { requisitions, currentUser, userId, overdueCount } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  const isOverdue = (req: any) => new Date(req.expectedReturnDate).getTime() < Date.now();

  return (
    <div>
      <h1 className="page-title">归还核验</h1>
      
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted">
              当前用户: <strong>{currentUser?.name}</strong>
              <span className="text-sm"> (实验室管理员)</span>
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-sm">
              <span className="text-muted">待归还: </span>
              <span className="font-semibold">{requisitions.length} 件</span>
            </div>
            {overdueCount > 0 && (
              <div className="text-sm">
                <span className="text-muted">逾期: </span>
                <span className="font-semibold" style={{ color: "#ef4444" }}>{overdueCount} 件</span>
              </div>
            )}
            <select 
              className="form-input" 
              style={{ width: "auto" }}
              defaultValue={userId}
              onChange={(e) => {
                window.location.href = `/returns?userId=${e.target.value}`;
              }}
            >
              <option value="4">陈管理员</option>
              <option value="5">刘安全员</option>
            </select>
          </div>
        </div>
      </div>

      {actionData?.error && (
        <div className="alert alert-danger mb-6">
          {actionData.error}
        </div>
      )}

      {requisitions.length === 0 ? (
        <div className="card">
          <div className="text-center py-12 text-muted">
            暂无待归还的试剂
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {requisitions.map((req) => (
            <div key={req.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">{req.reagent?.name}</span>
                    <span className="text-sm text-muted">({req.requisitionNo})</span>
                    {isOverdue(req) && (
                      <span className="badge badge-red">逾期</span>
                    )}
                  </div>
                  <div className="text-sm text-muted mt-1">
                    领用人: {req.requester?.name} ({req.requester?.college})
                  </div>
                </div>
                <span className={`badge badge-${getStatusBadgeColor(req.status)}`}>
                  {getStatusInfo(req.status).label}
                </span>
              </div>
              
              <div className="grid grid-4 mb-4 text-sm">
                <div>
                  <span className="text-muted">领用数量:</span>
                  <div className="font-semibold mt-1">
                    {req.quantity} {req.reagent?.unit}
                  </div>
                </div>
                <div>
                  <span className="text-muted">领取时间:</span>
                  <div className="mt-1">
                    {req.pickedUpAt ? formatDateTime(req.pickedUpAt) : "-"}
                  </div>
                </div>
                <div>
                  <span className="text-muted">应归还日期:</span>
                  <div className={`mt-1 ${isOverdue(req) ? "font-semibold" : ""}`} style={{ color: isOverdue(req) ? "#ef4444" : "inherit" }}>
                    {formatDate(req.expectedReturnDate)}
                  </div>
                </div>
                <div>
                  <span className="text-muted">逾期天数:</span>
                  <div className={`mt-1 ${isOverdue(req) ? "font-semibold" : ""}`} style={{ color: isOverdue(req) ? "#ef4444" : "inherit" }}>
                    {isOverdue(req) 
                      ? `${Math.floor((Date.now() - new Date(req.expectedReturnDate).getTime()) / (1000 * 60 * 60 * 24))} 天`
                      : "未逾期"
                    }
                  </div>
                </div>
              </div>
              
              <details>
                <summary className="cursor-pointer text-sm text-primary mb-2">
                  展开归还核验
                </summary>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Form method="post">
                    <input type="hidden" name="requisitionId" value={req.id} />
                    <input type="hidden" name="userId" value={userId} />
                    
                    <div className="grid grid-3 mb-4">
                      <div className="form-group">
                        <label className="form-label">归还数量 ({req.reagent?.unit})</label>
                        <input 
                          type="number" 
                          name="returnedQuantity" 
                          className="form-input"
                          min="0"
                          max={req.quantity}
                          step="0.01"
                          defaultValue={req.quantity}
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
                      <div className="form-group">
                        <label className="form-label">备注</label>
                        <input 
                          type="text" 
                          name="notes" 
                          className="form-input"
                          placeholder="可选"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button type="submit" className="btn btn-success">
                        确认归还核验
                      </button>
                    </div>
                  </Form>
                </div>
              </details>
            </div>
          ))}
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
