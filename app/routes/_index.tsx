import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getAllReagents, getStatistics } from "~/db/queries";
import { getHazardLevelName, getPermissionLevelName } from "~/utils/permissions";

export async function loader({ request }: LoaderFunctionArgs) {
  const reagents = await getAllReagents();
  const stats = await getStatistics();
  return json({ reagents, stats });
}

export default function Index() {
  const { reagents, stats } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="page-title">试剂目录</h1>

      <div className="grid grid-4 mb-6">
        <div className="stat-card">
          <div className="stat-value">{stats.totalReagents}</div>
          <div className="stat-label">试剂总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalRequisitions}</div>
          <div className="stat-label">领用记录</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#ef4444" }}>{stats.overdueCount}</div>
          <div className="stat-label">逾期未还</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#3b82f6" }}>{stats.pendingCount}</div>
          <div className="stat-label">待审批</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">试剂列表</div>
        <table className="table">
          <thead>
            <tr>
              <th>试剂编号</th>
              <th>名称</th>
              <th>类别</th>
              <th>危险等级</th>
              <th>所需权限</th>
              <th>剩余量</th>
              <th>存放位置</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {reagents.map((reagent) => {
              const hazardInfo = getHazardLevelName(reagent.hazardLevel);
              const stockPercent = (reagent.remainingQuantity / reagent.totalQuantity) * 100;
              const isLowStock = stockPercent < 20;
              
              return (
                <tr key={reagent.id}>
                  <td className="font-semibold">{reagent.reagentCode}</td>
                  <td>{reagent.name}</td>
                  <td className="text-muted text-sm">{reagent.category}</td>
                  <td>
                    <span className={`badge badge-${getBadgeColor(reagent.hazardLevel)}`}>
                      {hazardInfo.label}
                    </span>
                  </td>
                  <td className="text-sm">
                    Lv.{reagent.requiredPermissionLevel}
                    <span className="text-muted"> ({getPermissionLevelName(reagent.requiredPermissionLevel).split("（")[1]?.replace("）", "")})</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className={isLowStock ? "font-semibold" : ""} style={{ color: isLowStock ? "#ef4444" : "inherit" }}>
                        {reagent.remainingQuantity} {reagent.unit}
                      </span>
                      {isLowStock && (
                        <span className="badge badge-red">库存不足</span>
                      )}
                    </div>
                    <div className="text-xs text-muted">
                      总库存: {reagent.totalQuantity} {reagent.unit}
                    </div>
                  </td>
                  <td className="text-sm text-muted">{reagent.location}</td>
                  <td>
                    <a href={`/reagents/${reagent.id}`} className="btn btn-primary btn-sm">
                      查看详情
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
