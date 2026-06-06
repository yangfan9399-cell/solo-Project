import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { 
  getStatistics, 
  getStatisticsByCollege, 
  getStatisticsByCategory,
  getOverdueStatistics,
  getApprovalDurationStats
} from "~/db/queries";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const userId = parseInt(url.searchParams.get("userId") || "1");
  
  const [stats, byCollege, byCategory, overdue, approvalDuration] = await Promise.all([
    getStatistics(),
    getStatisticsByCollege(),
    getStatisticsByCategory(),
    getOverdueStatistics(),
    getApprovalDurationStats(),
  ]);
  
  return json({ 
    stats, 
    byCollege, 
    byCategory, 
    overdue, 
    approvalDuration,
    userId 
  });
}

export default function Statistics() {
  const { stats, byCollege, byCategory, overdue, approvalDuration, userId } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="page-title">统计分析</h1>

      <div className="grid grid-4 mb-6">
        <div className="stat-card">
          <div className="stat-value">{stats.totalReagents}</div>
          <div className="stat-label">试剂总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalRequisitions}</div>
          <div className="stat-label">累计领用</div>
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

      <div className="grid grid-2 mb-6">
        <div className="card">
          <h2 className="section-title">审批效率</h2>
          <div className="grid grid-2">
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-primary">
                {approvalDuration.avgApprovalHours} <span className="text-sm font-normal text-muted">小时</span>
              </div>
              <div className="text-sm text-muted mt-1">平均审批时长</div>
            </div>
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-success">
                {approvalDuration.totalApproved} <span className="text-sm font-normal text-muted">件</span>
              </div>
              <div className="text-sm text-muted mt-1">累计已审批</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h2 className="section-title">按学院统计</h2>
          <div className="space-y-3">
            {byCollege.map((item) => (
              <div key={item.college}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.college || "未知"}</span>
                  <span className="font-semibold">{item.count} 次</span>
                </div>
                <div style={{ 
                  height: "8px", 
                  background: "#e2e8f0", 
                  borderRadius: "4px",
                  overflow: "hidden"
                }}>
                  <div 
                    style={{ 
                      width: `${(item.count / Math.max(...byCollege.map(c => c.count), 1)) * 100}%`, 
                      height: "100%",
                      background: "#3b82f6",
                      borderRadius: "4px"
                    }}
                  />
                </div>
              </div>
            ))}
            {byCollege.length === 0 && (
              <p className="text-muted text-center py-4">暂无数据</p>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="section-title">按试剂类别统计</h2>
        <table className="table">
          <thead>
            <tr>
              <th>试剂类别</th>
              <th>领用次数</th>
              <th>累计用量</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {byCategory.map((item) => {
              const maxCount = Math.max(...byCategory.map(c => c.count), 1);
              const percentage = ((item.count / maxCount) * 100).toFixed(1);
              return (
                <tr key={item.category}>
                  <td className="font-medium">{item.category || "未知"}</td>
                  <td>{item.count} 次</td>
                  <td>{item.totalQuantity?.toFixed(0) || 0}</td>
                  <td style={{ width: "200px" }}>
                    <div className="flex items-center gap-2">
                      <div style={{ flex: 1, height: "8px", background: "#e2e8f0", borderRadius: "4px" }}>
                        <div 
                          style={{ 
                            width: `${percentage}%`, 
                            height: "100%",
                            background: "#22c55e",
                            borderRadius: "4px"
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted w-12 text-right">{percentage}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {byCategory.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted py-8">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title" style={{ margin: 0, border: "none", padding: 0 }}>
            逾期记录
          </h2>
          <span className="badge badge-red">{overdue.length} 条逾期</span>
        </div>
        
        {overdue.length === 0 ? (
          <p className="text-muted text-center py-8">暂无逾期记录</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>申请单号</th>
                <th>试剂名称</th>
                <th>领用人</th>
                <th>所属学院</th>
                <th>领用数量</th>
                <th>应归还日期</th>
                <th>逾期天数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {overdue.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold">{item.requisitionNo}</td>
                  <td>{item.reagentName}</td>
                  <td>{item.requesterName}</td>
                  <td className="text-sm text-muted">{item.college}</td>
                  <td>{item.quantity}</td>
                  <td className="text-sm">{formatDate(item.expectedReturnDate)}</td>
                  <td>
                    <span className="badge badge-red">
                      {item.overdueDays} 天
                    </span>
                  </td>
                  <td>
                    <a 
                      href={`/requisitions/${item.id}?userId=${userId}`}
                      className="btn btn-outline btn-sm"
                    >
                      催还
                    </a>
                  </td>
                </tr>
              ))}
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
