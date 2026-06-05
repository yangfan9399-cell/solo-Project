import { useState } from "react";
import { useLoaderData, Link, useNavigate, useOutletContext } from "react-router";
import { StatusBadge } from "~/components/StatusBadge";
import { ConstructionTypeBadge } from "~/components/ConstructionTypeBadge";
import { getPermits, getAreas, getTeams } from "~/lib/services";
import { CONSTRUCTION_TYPES, PERMIT_STATUS_LABELS, type UserRole } from "~/lib/utils";
import type { Permit, ConstructionArea, ConstructionTeam } from "~/lib/types";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

export const loader = async () => {
  const permits = await getPermits();
  const areas = await getAreas();
  const teams = await getTeams();
  return { permits, areas, teams };
};

export default function PermitsIndex() {
  const { permits, areas, teams } = useLoaderData<typeof loader>();
  const { currentRole } = useOutletContext<{ currentRole: UserRole }>();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredPermits = permits.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (typeFilter && p.constructionType !== typeFilter) return false;
    if (areaFilter && String(p.areaId) !== areaFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const team = teams.find((t) => t.id === p.teamId);
      if (
        !p.permitNumber.toLowerCase().includes(q) &&
        !p.workContent.toLowerCase().includes(q) &&
        !team?.name.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const getTeamName = (teamId: number) => {
    return teams.find((t) => t.id === teamId)?.name || "未知";
  };

  const getAreaName = (areaId: number) => {
    return areas.find((a) => a.id === areaId)?.name || "未知";
  };

  const stats = {
    total: permits.length,
    pending: permits.filter((p) =>
      ["PENDING_DOCUMENT", "PENDING_AREA_CONFIRM", "PENDING_SAFETY_BRIEFING"].includes(p.status)
    ).length,
    approved: permits.filter((p) => p.status === "APPROVED").length,
    inProgress: permits.filter((p) => p.status === "IN_PROGRESS").length,
    anomaly: permits.filter((p) => p.anomalyType && p.anomalyType !== "NONE").length,
    completed: permits.filter((p) => p.status === "COMPLETED").length,
  };

  const getActions = (permit: Permit) => {
    const actions: { label: string; onClick: () => void; variant: string }[] = [];

    if (currentRole === "SECURITY_OFFICER") {
      if (permit.status === "PENDING_DOCUMENT") {
        actions.push({
          label: "补齐证件",
          onClick: () => {},
          variant: "primary",
        });
      }
      if (permit.status === "APPROVED") {
        actions.push({
          label: "入园登记",
          onClick: () => {},
          variant: "success",
        });
      }
      if (permit.status === "IN_PROGRESS") {
        actions.push({
          label: "离场核销",
          onClick: () => {},
          variant: "warning",
        });
      }
      if (permit.status === "AREA_CONFLICT") {
        actions.push({
          label: "调整重提",
          onClick: () => {},
          variant: "primary",
        });
      }
      if (permit.status === "SAFETY_BRIEFING_REJECTED") {
        actions.push({
          label: "重新提交",
          onClick: () => {},
          variant: "primary",
        });
      }
    }

    if (currentRole === "ENGINEERING_MANAGER") {
      if (permit.status === "PENDING_AREA_CONFIRM") {
        actions.push({
          label: "确认区域",
          onClick: () => {},
          variant: "success",
        });
      }
    }

    if (currentRole === "SAFETY_REVIEWER") {
      if (permit.status === "PENDING_SAFETY_BRIEFING") {
        actions.push({
          label: "交底审核",
          onClick: () => {},
          variant: "primary",
        });
      }
    }

    actions.push({
      label: "查看详情",
      onClick: () => navigate(`/permits/${permit.id}`),
      variant: "secondary",
    });

    return actions;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">施工许可管理</h1>
          <p className="text-slate-500 mt-1">管理外来施工队的入园申请、审批与离场核销</p>
        </div>
        {currentRole === "SECURITY_OFFICER" && (
          <Link to="/permits/new" className="btn-primary">
            <span className="mr-2">➕</span>新建施工许可
          </Link>
        )}
      </div>

      <div className="grid grid-cols-6 gap-4">
        <StatCard label="全部许可" value={stats.total} color="slate" />
        <StatCard label="待处理" value={stats.pending} color="warning" />
        <StatCard label="已批准" value={stats.approved} color="primary" />
        <StatCard label="施工中" value={stats.inProgress} color="success" />
        <StatCard label="异常单" value={stats.anomaly} color="danger" />
        <StatCard label="已完成" value={stats.completed} color="slate" />
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="label">搜索</label>
            <input
              type="text"
              className="input"
              placeholder="搜索许可编号、施工内容、施工队..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-40">
            <label className="label">状态</label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">全部状态</option>
              {Object.entries(PERMIT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-44">
            <label className="label">施工类型</label>
            <select
              className="input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">全部类型</option>
              {CONSTRUCTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-44">
            <label className="label">施工区域</label>
            <select
              className="input"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value="">全部区域</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn-secondary"
            onClick={() => {
              setStatusFilter("");
              setTypeFilter("");
              setAreaFilter("");
              setSearchQuery("");
            }}
          >
            重置筛选
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  许可编号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  施工队
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  施工类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  施工区域
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  施工时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                {currentRole === "SECURITY_OFFICER" && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    异常
                  </th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredPermits.length === 0 ? (
                <tr>
                  <td colSpan={currentRole === "SECURITY_OFFICER" ? 8 : 7} className="px-6 py-12 text-center text-slate-500">
                    <div className="text-4xl mb-3">📭</div>
                    暂无符合条件的施工许可
                  </td>
                </tr>
              ) : (
                filteredPermits.map((permit) => (
                  <tr key={permit.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{permit.permitNumber}</div>
                      <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">{permit.workContent}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{getTeamName(permit.teamId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ConstructionTypeBadge type={permit.constructionType} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{getAreaName(permit.areaId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <div>{format(parseISO(permit.startDate), "MM月dd日", { locale: zhCN })} - {format(parseISO(permit.endDate), "MM月dd日", { locale: zhCN })}</div>
                      <div className="text-xs text-slate-400">{permit.startTime.slice(0, 5)} - {permit.endTime.slice(0, 5)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={permit.status} />
                    </td>
                    {currentRole === "SECURITY_OFFICER" && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {permit.anomalyType && permit.anomalyType !== "NONE" ? (
                          <span className="text-danger-600 text-sm flex items-center gap-1">
                            <span>⚠️</span>
                            {permit.anomalyReason || "异常"}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        {getActions(permit).slice(0, 2).map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (action.label === "查看详情") {
                                navigate(`/permits/${permit.id}`);
                              } else {
                                navigate(`/permits/${permit.id}`);
                              }
                            }}
                            className={`text-sm px-3 py-1.5 rounded-md font-medium transition-all ${
                              action.variant === "primary"
                                ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
                                : action.variant === "success"
                                ? "bg-success-100 text-success-700 hover:bg-success-200"
                                : action.variant === "warning"
                                ? "bg-warning-100 text-warning-700 hover:bg-warning-200"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    primary: "from-primary-500 to-primary-700",
    success: "from-success-500 to-success-700",
    warning: "from-warning-500 to-warning-700",
    danger: "from-danger-500 to-danger-700",
    slate: "from-slate-500 to-slate-700",
  };

  return (
    <div className="card p-4 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color] || colorClasses.slate}`}></div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
