import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getRequisitionsByRequester, getUserById, getReagentById } from "~/db/queries";
import { getStatusInfo } from "~/utils/permissions";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const userId = parseInt(url.searchParams.get("userId") || "1");
  
  const requisitions = await getRequisitionsByRequester(userId);
  const user = await getUserById(userId);
  
  const requisitionsWithDetails = await Promise.all(
    requisitions.map(async (req) => {
      const reagent = await getReagentById(req.reagentId);
      return { ...req, reagent };
    })
  );
  
  return json({ requisitions: requisitionsWithDetails, user, userId });
}

export default function Requisitions() {
  const { requisitions, user, userId } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="page-title">我的领用申请</h1>
      
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <p className="text-muted">当前用户: <strong>{user?.name}</strong> ({user?.college})</p>
          <div className="flex gap-2">
            <select 
              className="form-input" 
              style={{ width: "auto" }}
              defaultValue={userId}
              onChange={(e) => {
                window.location.href = `/requisitions?userId=${e.target.value}`;
              }}
            >
              <option value="1">张实验员 (Lv.1)</option>
              <option value="2">李研究员 (Lv.2)</option>
              <option value="3">王高级 (Lv.3)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">申请记录</div>
        {requisitions.length === 0 ? (
          <p className="text-muted text-center py-8">暂无领用记录</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>申请单号</th>
                <th>试剂名称</th>
                <th>申请数量</th>
                <th>申请时间</th>
                <th>预计归还</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {requisitions.map((req) => {
                const statusInfo = getStatusInfo(req.status);
                return (
                  <tr key={req.id}>
                    <td className="font-semibold">{req.requisitionNo}</td>
                    <td>{req.reagent?.name}</td>
                    <td>{req.quantity} {req.reagent?.unit}</td>
                    <td className="text-sm text-muted">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="text-sm">
                      {formatDate(req.expectedReturnDate)}
                      {req.status === "overdue" && (
                        <span className="badge badge-red ml-2">逾期</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${getStatusBadgeColor(req.status)}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td>
                      <a href={`/requisitions/${req.id}?userId=${userId}`} className="btn btn-outline btn-sm">
                        查看详情
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
