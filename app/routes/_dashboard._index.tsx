import { Link, useLoaderData } from "react-router";
import { db } from "~/db";
import { workPermits, contractors, workers, certificates } from "~/db/schema";
import { sql, count, eq, gt, and } from "drizzle-orm";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ title: "仪表盘 - 舞台搭建进场系统" }];
};

export async function loader() {
  const totalPermits = await db.select({ count: count() }).from(workPermits);
  const pendingPermits = await db
    .select({ count: count() })
    .from(workPermits)
    .where(sql`status IN ('submitted', 'security_approved', 'safety_approved')`);

  const totalContractors = await db.select({ count: count() }).from(contractors);
  const totalWorkers = await db.select({ count: count() }).from(workers);

  const today = new Date();
  const expiredCerts = await db
    .select({ count: count() })
    .from(certificates)
    .where(lt(certificates.expiryDate, today));

  const recentPermits = await db
    .select({
      id: workPermits.id,
      permitNumber: workPermits.permitNumber,
      title: workPermits.title,
      status: workPermits.status,
      createdAt: workPermits.createdAt,
      contractorName: contractors.name,
    })
    .from(workPermits)
    .leftJoin(contractors, eq(workPermits.contractorId, contractors.id))
    .orderBy(sql`${workPermits.createdAt} DESC`)
    .limit(5);

  return {
    stats: {
      totalPermits: totalPermits[0]?.count || 0,
      pendingPermits: pendingPermits[0]?.count || 0,
      totalContractors: totalContractors[0]?.count || 0,
      totalWorkers: totalWorkers[0]?.count || 0,
      expiredCerts: expiredCerts[0]?.count || 0,
    },
    recentPermits,
  };
}

function lt(column: any, value: Date) {
  return sql`${column} < ${value.toISOString().split("T")[0]}`;
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    draft: { label: "草稿", className: "badge-secondary" },
    submitted: { label: "已提交", className: "badge-info" },
    security_approved: { label: "安保通过", className: "badge-info" },
    security_rejected: { label: "安保驳回", className: "badge-danger" },
    safety_approved: { label: "安全通过", className: "badge-info" },
    safety_rejected: { label: "安全驳回", className: "badge-danger" },
    manager_approved: { label: "已批准", className: "badge-success" },
    manager_rejected: { label: "项目经理驳回", className: "badge-danger" },
    archived: { label: "已归档", className: "badge-secondary" },
  };
  const info = statusMap[status] || { label: status, className: "badge-secondary" };
  return <span className={`badge ${info.className}`}>{info.label}</span>;
}

export default function Index() {
  const { stats, recentPermits } = useLoaderData<typeof loader>();

  const statCards = [
    {
      label: "总作业许可证",
      value: stats.totalPermits,
      icon: "📋",
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "待审批",
      value: stats.pendingPermits,
      icon: "⏳",
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "承包商",
      value: stats.totalContractors,
      icon: "🏢",
      color: "bg-green-50 text-green-600",
    },
    {
      label: "施工人员",
      value: stats.totalWorkers,
      icon: "👷",
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">仪表盘</h1>
          <p className="text-slate-500 mt-1">演唱会舞台搭建进场证与高空作业验收系统</p>
        </div>
        <Link to="/permits/new" className="btn btn-primary">
          + 新建作业申请
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {stats.expiredCerts > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-medium text-red-800">证照过期提醒</p>
            <p className="text-sm text-red-600">
              有 {stats.expiredCerts} 个资质证书已过期，请及时处理
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">最近申请</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {recentPermits.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              暂无作业申请记录
            </div>
          ) : (
            recentPermits.map((permit) => (
              <Link
                key={permit.id}
                to={`/permits/${permit.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900">{permit.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {permit.permitNumber} · {permit.contractorName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(permit.status)}
                  <span className="text-sm text-slate-400">
                    {new Date(permit.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
        <div className="p-4 border-t border-slate-200">
          <Link to="/permits" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            查看全部 →
          </Link>
        </div>
      </div>
    </div>
  );
}
