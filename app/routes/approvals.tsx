import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { 
  getPendingLabApprovals, 
  getPendingSafetyApprovals, 
  getPendingEscalatedApprovals,
  getReagentById,
  getUserById
} from "~/db/queries";
import { getStatusInfo } from "~/utils/permissions";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const userId = parseInt(url.searchParams.get("userId") || "4");
  
  const labApprovals = await getPendingLabApprovals();
  const safetyApprovals = await getPendingSafetyApprovals();
  const escalatedApprovals = await getPendingEscalatedApprovals(userId);
  
  const currentUser = await getUserById(userId);
  
  const labApprovalsWithDetails = await Promise.all(
    labApprovals.map(async (req) => {
      const reagent = await getReagentById(req.reagentId);
      const requester = await getUserById(req.requesterId);
      return { ...req, reagent, requester };
    })
  );
  
  const safetyApprovalsWithDetails = await Promise.all(
    safetyApprovals.map(async (req) => {
      const reagent = await getReagentById(req.reagentId);
      const requester = await getUserById(req.requesterId);
      return { ...req, reagent, requester };
    })
  );
  
  const escalatedApprovalsWithDetails = await Promise.all(
    escalatedApprovals.map(async (req) => {
      const reagent = await getReagentById(req.reagentId);
      const requester = await getUserById(req.requesterId);
      return { ...req, reagent, requester };
    })
  );
  
  return json({ 
    labApprovals: labApprovalsWithDetails, 
    safetyApprovals: safetyApprovalsWithDetails,
    escalatedApprovals: escalatedApprovalsWithDetails,
    currentUser,
    userId 
  });
}

export default function Approvals() {
  const { labApprovals, safetyApprovals, escalatedApprovals, currentUser, userId } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState("lab");
  
  const tabs = [
    { id: "lab", label: "待核验库存", count: labApprovals.length },
    { id: "safety", label: "待安全审批", count: safetyApprovals.length },
    { id: "escalated", label: "升级审批", count: escalatedApprovals.length },
  ];

  let currentList: any[] = [];
  if (activeTab === "lab") currentList = labApprovals;
  else if (activeTab === "safety") currentList = safetyApprovals;
  else currentList = escalatedApprovals;

  return (
    <div>
      <h1 className="page-title">审批中心</h1>
      
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <p className="text-muted">
            当前用户: <strong>{currentUser?.name}</strong> 
            <span className="text-sm"> ({currentUser?.role === "lab_admin" ? "实验室管理员" : currentUser?.role === "safety_officer" ? "安全员" : "实验员"})</span>
          </p>
          <div className="flex gap-2">
            <select 
              className="form-input" 
              style={{ width: "auto" }}
              defaultValue={userId}
              onChange={(e) => {
                window.location.href = `/approvals?userId=${e.target.value}`;
              }}
            >
              <option value="4">陈管理员 (实验室管理员)</option>
              <option value="5">刘安全员 (安全员)</option>
              <option value="6">赵主任 (安全主任)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="badge badge-blue" style={{ marginLeft: "0.5rem" }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {currentList.length === 0 ? (
          <div className="text-center py-12 text-muted">
            暂无待审批项
          </div>
        ) : (
          <div className="space-y-4">
            {currentList.map((req) => {
              const statusInfo = getStatusInfo(req.status);
              return (
                <div key={req.id} className="card" style={{ marginBottom: "1rem" }}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-semibold text-lg">
                        {req.reagent?.name}
                        <span className="text-sm text-muted ml-2">
                          ({req.reagent?.reagentCode})
                        </span>
                      </div>
                      <div className="text-sm text-muted">
                        申请人: {req.requester?.name} ({req.requester?.college})
                      </div>
                    </div>
                    <span className={`badge badge-${getStatusBadgeColor(req.status)}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  
                  <div className="grid grid-3 mb-4 text-sm">
                    <div>
                      <span className="text-muted">申请数量:</span>
                      <span className="font-semibold ml-2">
                        {req.quantity} {req.reagent?.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">库存剩余:</span>
                      <span className={`ml-2 ${req.reagent && req.quantity > req.reagent.remainingQuantity ? "text-danger" : ""}`} style={{ color: req.reagent && req.quantity > req.reagent.remainingQuantity ? "#ef4444" : "inherit" }}>
                        {req.reagent?.remainingQuantity} {req.reagent?.unit}
                        {req.reagent && req.quantity > req.reagent.remainingQuantity && (
                          <span className="text-danger ml-2">（库存不足）</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">预计归还:</span>
                      <span className="ml-2">{formatDate(req.expectedReturnDate)}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm text-muted mb-1">用途:</div>
                    <p className="text-sm">{req.purpose}</p>
                  </div>
                  
                  {req.status === "escalated" && (
                    <div className="alert alert-warning mb-4">
                      <strong>⚠️ 升级审批：</strong>
                      申请人权限等级不足（Lv.{req.requester?.permissionLevel}），
                      该试剂需要 Lv.{req.reagent?.requiredPermissionLevel} 权限
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <a 
                      href={`/requisitions/${req.id}?userId=${userId}`} 
                      className="btn btn-primary"
                    >
                      查看并审批
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
