import { useLoaderData, useSearchParams, useNavigate } from "react-router";
import { db } from "~/db";
import { workPermits, contractors, permitIssues } from "~/db/schema";
import { sql, eq, and, count, desc, gte, lte } from "drizzle-orm";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ title: "复盘统计 - 舞台搭建进场系统" }];
};

interface ContractorStats {
  id: number;
  name: string;
  totalCount: number;
  approvedCount: number;
  rejectedCount: number;
  avgApprovalHours: number;
  issueCount: number;
}

interface WorkTypeStats {
  workType: string;
  totalCount: number;
  approvedCount: number;
  rejectedCount: number;
  rejectRate: number;
}

interface IssueTypeStats {
  issueType: string;
  occurrenceCount: number;
  permitCount: number;
  blockingCount: number;
}

interface WaitTimeDistribution {
  range: string;
  count: number;
}

interface OverviewStats {
  totalPermits: number;
  approvedPermits: number;
  rejectedPermits: number;
  pendingPermits: number;
  avgApprovalHours: number;
  totalIssues: number;
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  const dateConditions = [];
  if (startDate) {
    dateConditions.push(gte(workPermits.createdAt, new Date(startDate)));
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateConditions.push(lte(workPermits.createdAt, end));
  }
  const dateWhere = dateConditions.length > 0 ? and(...dateConditions) : undefined;

  const totalPermitsResult = await db
    .select({ count: count() })
    .from(workPermits)
    .where(dateWhere);

  const approvedPermitsResult = await db
    .select({ count: count() })
    .from(workPermits)
    .where(
      dateWhere
        ? and(dateWhere, sql`status IN ('manager_approved', 'archived')`)
        : sql`status IN ('manager_approved', 'archived')`
    );

  const rejectedPermitsResult = await db
    .select({ count: count() })
    .from(workPermits)
    .where(
      dateWhere
        ? and(
            dateWhere,
            sql`status IN ('security_rejected', 'safety_rejected', 'manager_rejected')`
          )
        : sql`status IN ('security_rejected', 'safety_rejected', 'manager_rejected')`
    );

  const pendingPermitsResult = await db
    .select({ count: count() })
    .from(workPermits)
    .where(
      dateWhere
        ? and(
            dateWhere,
            sql`status IN ('submitted', 'security_approved', 'safety_approved')`
          )
        : sql`status IN ('submitted', 'security_approved', 'safety_approved')`
    );

  const avgApprovalResult = await db
    .select({
      avgHours: sql<number>`AVG(EXTRACT(EPOCH FROM (${workPermits.managerApprovedAt} - ${workPermits.submittedAt})) / 3600)`,
    })
    .from(workPermits)
    .where(
      dateWhere
        ? and(
            dateWhere,
            sql`${workPermits.submittedAt} IS NOT NULL AND ${workPermits.managerApprovedAt} IS NOT NULL`
          )
        : sql`${workPermits.submittedAt} IS NOT NULL AND ${workPermits.managerApprovedAt} IS NOT NULL`
    );

  const totalIssuesResult = await db
    .select({ count: count() })
    .from(permitIssues)
    .innerJoin(workPermits, eq(permitIssues.permitId, workPermits.id))
    .where(dateWhere);

  const overview: OverviewStats = {
    totalPermits: totalPermitsResult[0]?.count || 0,
    approvedPermits: approvedPermitsResult[0]?.count || 0,
    rejectedPermits: rejectedPermitsResult[0]?.count || 0,
    pendingPermits: pendingPermitsResult[0]?.count || 0,
    avgApprovalHours: Number(avgApprovalResult[0]?.avgHours) || 0,
    totalIssues: totalIssuesResult[0]?.count || 0,
  };

  const contractorStatsResult = await db
    .select({
      id: contractors.id,
      name: contractors.name,
      totalCount: count(workPermits.id),
      approvedCount: sql<number>`SUM(CASE WHEN ${workPermits.status} IN ('manager_approved', 'archived') THEN 1 ELSE 0 END)`,
      rejectedCount: sql<number>`SUM(CASE WHEN ${workPermits.status} IN ('security_rejected', 'safety_rejected', 'manager_rejected') THEN 1 ELSE 0 END)`,
      avgApprovalHours: sql<number>`AVG(EXTRACT(EPOCH FROM (${workPermits.managerApprovedAt} - ${workPermits.submittedAt})) / 3600)`,
      issueCount: sql<number>`(SELECT COUNT(*) FROM ${permitIssues} WHERE ${permitIssues.permitId} IN (SELECT ${workPermits.id} FROM ${workPermits} WHERE ${workPermits.contractorId} = ${contractors.id}${dateWhere ? sql` AND ${dateWhere}` : sql``}))`,
    })
    .from(contractors)
    .leftJoin(workPermits, eq(contractors.id, workPermits.contractorId))
    .groupBy(contractors.id, contractors.name)
    .orderBy(desc(count(workPermits.id)));

  const contractorStats: ContractorStats[] = contractorStatsResult.map((row) => ({
    id: row.id,
    name: row.name,
    totalCount: Number(row.totalCount) || 0,
    approvedCount: Number(row.approvedCount) || 0,
    rejectedCount: Number(row.rejectedCount) || 0,
    avgApprovalHours: Number(row.avgApprovalHours) || 0,
    issueCount: Number(row.issueCount) || 0,
  }));

  const workTypeStatsResult = await db
    .select({
      workType: workPermits.workType,
      totalCount: count(workPermits.id),
      approvedCount: sql<number>`SUM(CASE WHEN ${workPermits.status} IN ('manager_approved', 'archived') THEN 1 ELSE 0 END)`,
      rejectedCount: sql<number>`SUM(CASE WHEN ${workPermits.status} IN ('security_rejected', 'safety_rejected', 'manager_rejected') THEN 1 ELSE 0 END)`,
    })
    .from(workPermits)
    .where(dateWhere)
    .groupBy(workPermits.workType)
    .orderBy(desc(count(workPermits.id)));

  const workTypeStats: WorkTypeStats[] = workTypeStatsResult.map((row) => {
    const total = Number(row.totalCount) || 0;
    const rejected = Number(row.rejectedCount) || 0;
    return {
      workType: row.workType,
      totalCount: total,
      approvedCount: Number(row.approvedCount) || 0,
      rejectedCount: rejected,
      rejectRate: total > 0 ? (rejected / total) * 100 : 0,
    };
  });

  const issueTypeStatsResult = await db
    .select({
      issueType: permitIssues.issueType,
      occurrenceCount: count(permitIssues.id),
      permitCount: sql<number>`COUNT(DISTINCT ${permitIssues.permitId})`,
      blockingCount: sql<number>`SUM(CASE WHEN ${permitIssues.isBlocking} = true THEN 1 ELSE 0 END)`,
    })
    .from(permitIssues)
    .innerJoin(workPermits, eq(permitIssues.permitId, workPermits.id))
    .where(dateWhere)
    .groupBy(permitIssues.issueType)
    .orderBy(desc(count(permitIssues.id)));

  const issueTypeStats: IssueTypeStats[] = issueTypeStatsResult.map((row) => ({
    issueType: row.issueType,
    occurrenceCount: Number(row.occurrenceCount) || 0,
    permitCount: Number(row.permitCount) || 0,
    blockingCount: Number(row.blockingCount) || 0,
  }));

  const waitTimeResult = await db
    .select({
      lessThan1Day: sql<number>`SUM(CASE WHEN EXTRACT(EPOCH FROM (${workPermits.managerApprovedAt} - ${workPermits.submittedAt})) / 86400 < 1 THEN 1 ELSE 0 END)`,
      oneToThreeDays: sql<number>`SUM(CASE WHEN EXTRACT(EPOCH FROM (${workPermits.managerApprovedAt} - ${workPermits.submittedAt})) / 86400 >= 1 AND EXTRACT(EPOCH FROM (${workPermits.managerApprovedAt} - ${workPermits.submittedAt})) / 86400 < 3 THEN 1 ELSE 0 END)`,
      threeToSevenDays: sql<number>`SUM(CASE WHEN EXTRACT(EPOCH FROM (${workPermits.managerApprovedAt} - ${workPermits.submittedAt})) / 86400 >= 3 AND EXTRACT(EPOCH FROM (${workPermits.managerApprovedAt} - ${workPermits.submittedAt})) / 86400 < 7 THEN 1 ELSE 0 END)`,
      moreThanSevenDays: sql<number>`SUM(CASE WHEN EXTRACT(EPOCH FROM (${workPermits.managerApprovedAt} - ${workPermits.submittedAt})) / 86400 >= 7 THEN 1 ELSE 0 END)`,
    })
    .from(workPermits)
    .where(
      dateWhere
        ? and(
            dateWhere,
            sql`${workPermits.submittedAt} IS NOT NULL AND ${workPermits.managerApprovedAt} IS NOT NULL`
          )
        : sql`${workPermits.submittedAt} IS NOT NULL AND ${workPermits.managerApprovedAt} IS NOT NULL`
    );

  const waitTimeDistribution: WaitTimeDistribution[] = [
    { range: "<1天", count: Number(waitTimeResult[0]?.lessThan1Day) || 0 },
    { range: "1-3天", count: Number(waitTimeResult[0]?.oneToThreeDays) || 0 },
    { range: "3-7天", count: Number(waitTimeResult[0]?.threeToSevenDays) || 0 },
    { range: ">7天", count: Number(waitTimeResult[0]?.moreThanSevenDays) || 0 },
  ];

  return {
    overview,
    contractorStats,
    workTypeStats,
    issueTypeStats,
    waitTimeDistribution,
    filters: {
      startDate,
      endDate,
    },
  };
}

function getWorkTypeLabel(type: string) {
  const typeMap: Record<string, string> = {
    stage_setup: "舞台搭建",
    lighting_install: "灯光安装",
    sound_install: "音响安装",
    truss_hoisting: "桁架吊装",
    scaffolding: "脚手架",
    electrical: "电气作业",
    general: "综合作业",
  };
  return typeMap[type] || type;
}

function getIssueTypeLabel(type: string) {
  const typeMap: Record<string, string> = {
    certificate_expired: "证照过期",
    zone_conflict: "区域冲突",
    night_permit_missing: "夜间许可缺失",
    incomplete_info: "信息不完整",
    safety_violation: "安全违规",
    other: "其他问题",
  };
  return typeMap[type] || type;
}

function formatHours(hours: number): string {
  if (hours === 0) return "-";
  if (hours < 24) return `${hours.toFixed(1)}小时`;
  const days = hours / 24;
  return `${days.toFixed(1)}天`;
}

function ProgressBar({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full bg-slate-200 rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full transition-all duration-300`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  subValue,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subValue?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        </div>
        <div
          className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-2xl`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const {
    overview,
    contractorStats,
    workTypeStats,
    issueTypeStats,
    waitTimeDistribution,
    filters,
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) {
      newParams.set("startDate", e.target.value);
    } else {
      newParams.delete("startDate");
    }
    setSearchParams(newParams);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) {
      newParams.set("endDate", e.target.value);
    } else {
      newParams.delete("endDate");
    }
    setSearchParams(newParams);
  };

  const maxContractorTotal = Math.max(
    ...contractorStats.map((c) => c.totalCount),
    1
  );
  const maxWorkTypeTotal = Math.max(
    ...workTypeStats.map((w) => w.totalCount),
    1
  );
  const maxWaitTimeCount = Math.max(
    ...waitTimeDistribution.map((w) => w.count),
    1
  );
  const maxIssueCount = Math.max(
    ...issueTypeStats.map((i) => i.occurrenceCount),
    1
  );

  const approvalRate =
    overview.totalPermits > 0
      ? ((overview.approvedPermits / overview.totalPermits) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">复盘统计</h1>
          <p className="text-slate-500 mt-1">作业许可证审批数据统计与分析</p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="label">开始日期</label>
            <input
              type="date"
              className="input"
              value={filters.startDate || ""}
              onChange={handleStartDateChange}
            />
          </div>
          <div>
            <label className="label">结束日期</label>
            <input
              type="date"
              className="input"
              value={filters.endDate || ""}
              onChange={handleEndDateChange}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="总申请数"
          value={overview.totalPermits}
          icon="📋"
          color="bg-blue-50 text-blue-600"
          subValue={`通过率 ${approvalRate}%`}
        />
        <StatCard
          label="已通过"
          value={overview.approvedPermits}
          icon="✅"
          color="bg-green-50 text-green-600"
          subValue={`驳回 ${overview.rejectedPermits} 个`}
        />
        <StatCard
          label="待审批"
          value={overview.pendingPermits}
          icon="⏳"
          color="bg-amber-50 text-amber-600"
          subValue={`共 ${overview.totalIssues} 个问题`}
        />
        <StatCard
          label="平均审批时长"
          value={formatHours(overview.avgApprovalHours)}
          icon="⏱️"
          color="bg-purple-50 text-purple-600"
          subValue="提交到最终批准"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">承包商统计</h2>
            <p className="text-sm text-slate-500 mt-1">按申请数量排名</p>
          </div>
          <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
            {contractorStats.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                暂无承包商数据
              </div>
            ) : (
              contractorStats.map((contractor) => (
                <div
                  key={contractor.id}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      {contractor.name}
                    </span>
                    <span className="text-sm text-slate-500">
                      {contractor.totalCount} 个申请
                    </span>
                  </div>
                  <ProgressBar
                    value={contractor.totalCount}
                    max={maxContractorTotal}
                    color="bg-blue-500"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      通过:{" "}
                      <span className="text-green-600 font-medium">
                        {contractor.approvedCount}
                      </span>
                    </span>
                    <span>
                      驳回:{" "}
                      <span className="text-red-600 font-medium">
                        {contractor.rejectedCount}
                      </span>
                    </span>
                    <span>
                      问题:{" "}
                      <span className="text-amber-600 font-medium">
                        {contractor.issueCount}
                      </span>
                    </span>
                    <span>
                      均时:{" "}
                      <span className="font-medium">
                        {formatHours(contractor.avgApprovalHours)}
                      </span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">作业类型统计</h2>
            <p className="text-sm text-slate-500 mt-1">按作业类型分类</p>
          </div>
          <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
            {workTypeStats.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                暂无作业类型数据
              </div>
            ) : (
              workTypeStats.map((workType) => (
                <div key={workType.workType} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      {getWorkTypeLabel(workType.workType)}
                    </span>
                    <span className="text-sm text-slate-500">
                      {workType.totalCount} 个申请
                    </span>
                  </div>
                  <ProgressBar
                    value={workType.totalCount}
                    max={maxWorkTypeTotal}
                    color="bg-emerald-500"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      通过:{" "}
                      <span className="text-green-600 font-medium">
                        {workType.approvedCount}
                      </span>
                    </span>
                    <span>
                      驳回:{" "}
                      <span className="text-red-600 font-medium">
                        {workType.rejectedCount}
                      </span>
                    </span>
                    <span>
                      驳回率:{" "}
                      <span className="text-orange-600 font-medium">
                        {workType.rejectRate.toFixed(1)}%
                      </span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">证照问题类型分布</h2>
            <p className="text-sm text-slate-500 mt-1">各类问题发生情况统计</p>
          </div>
          <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
            {issueTypeStats.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                暂无问题数据
              </div>
            ) : (
              issueTypeStats.map((issue) => (
                <div key={issue.issueType} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      {getIssueTypeLabel(issue.issueType)}
                    </span>
                    <span className="text-sm text-slate-500">
                      {issue.occurrenceCount} 次
                    </span>
                  </div>
                  <ProgressBar
                    value={issue.occurrenceCount}
                    max={maxIssueCount}
                    color="bg-red-500"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      涉及许可:{" "}
                      <span className="font-medium">{issue.permitCount}</span>
                    </span>
                    <span>
                      阻断性:{" "}
                      <span className="text-red-600 font-medium">
                        {issue.blockingCount}
                      </span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">审批等待时长分布</h2>
            <p className="text-sm text-slate-500 mt-1">从提交到最终批准的时长</p>
          </div>
          <div className="p-5 space-y-6">
            {waitTimeDistribution.map((item) => (
              <div key={item.range} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{item.range}</span>
                  <span className="text-sm text-slate-500">{item.count} 个许可证</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar
                      value={item.count}
                      max={maxWaitTimeCount}
                      color="bg-cyan-500"
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-16 text-right">
                    {maxWaitTimeCount > 0
                      ? ((item.count / maxWaitTimeCount) * 100).toFixed(0)
                      : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
