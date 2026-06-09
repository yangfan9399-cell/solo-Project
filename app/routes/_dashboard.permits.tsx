import { Link, useLoaderData, useSearchParams, useNavigate } from "react-router";
import { db } from "~/db";
import { workPermits, contractors, permitStatusEnum } from "~/db/schema";
import { sql, eq, and, or, desc } from "drizzle-orm";
import type { MetaFunction } from "react-router";
import type { InferSelectModel } from "drizzle-orm";

export const meta: MetaFunction = () => {
  return [{ title: "作业许可证 - 舞台搭建进场系统" }];
};

type WorkPermitWithContractor = InferSelectModel<typeof workPermits> & {
  contractorName: string | null;
};

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const contractorId = url.searchParams.get("contractorId");
  const search = url.searchParams.get("search");

  const conditions = [];

  if (status && permitStatusEnum.enumValues.includes(status as any)) {
    conditions.push(eq(workPermits.status, status as typeof permitStatusEnum.enumValues[number]));
  }

  if (contractorId) {
    conditions.push(eq(workPermits.contractorId, parseInt(contractorId)));
  }

  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        sql`${workPermits.permitNumber} ILIKE ${searchPattern}`,
        sql`${workPermits.title} ILIKE ${searchPattern}`
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const permits = await db
    .select({
      id: workPermits.id,
      permitNumber: workPermits.permitNumber,
      title: workPermits.title,
      workType: workPermits.workType,
      status: workPermits.status,
      createdAt: workPermits.createdAt,
      contractorId: workPermits.contractorId,
      contractorName: contractors.name,
    })
    .from(workPermits)
    .leftJoin(contractors, eq(workPermits.contractorId, contractors.id))
    .where(whereClause)
    .orderBy(desc(workPermits.createdAt));

  const contractorList = await db
    .select({
      id: contractors.id,
      name: contractors.name,
    })
    .from(contractors)
    .orderBy(contractors.name);

  return {
    permits: permits as WorkPermitWithContractor[],
    contractorList,
    filters: {
      status,
      contractorId,
      search,
    },
  };
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

export default function Permits() {
  const { permits, contractorList, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) {
      newParams.set("status", e.target.value);
    } else {
      newParams.delete("status");
    }
    setSearchParams(newParams);
  };

  const handleContractorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) {
      newParams.set("contractorId", e.target.value);
    } else {
      newParams.delete("contractorId");
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) {
      newParams.set("search", e.target.value);
    } else {
      newParams.delete("search");
    }
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">作业许可证</h1>
          <p className="text-slate-500 mt-1">管理所有舞台搭建作业许可申请</p>
        </div>
        <Link to="/permits/new" className="btn btn-primary">
          + 新建作业申请
        </Link>
      </div>

      <div className="card">
        <div className="p-5 border-b border-slate-200">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="label">搜索</label>
              <input
                type="text"
                className="input"
                placeholder="搜索许可证编号或标题..."
                value={filters.search || ""}
                onChange={handleSearchChange}
              />
            </div>
            <div className="w-48">
              <label className="label">状态</label>
              <select
                className="input"
                value={filters.status || ""}
                onChange={handleStatusChange}
              >
                <option value="">全部状态</option>
                <option value="draft">草稿</option>
                <option value="submitted">已提交</option>
                <option value="security_approved">安保通过</option>
                <option value="security_rejected">安保驳回</option>
                <option value="safety_approved">安全通过</option>
                <option value="safety_rejected">安全驳回</option>
                <option value="manager_approved">已批准</option>
                <option value="manager_rejected">项目经理驳回</option>
                <option value="archived">已归档</option>
              </select>
            </div>
            <div className="w-56">
              <label className="label">承包商</label>
              <select
                className="input"
                value={filters.contractorId || ""}
                onChange={handleContractorChange}
              >
                <option value="">全部承包商</option>
                {contractorList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  许可证编号
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  标题
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  承包商
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  作业类型
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  创建时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {permits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    暂无作业许可证记录
                  </td>
                </tr>
              ) : (
                permits.map((permit) => (
                  <tr
                    key={permit.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/permits/${permit.id}`)}
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-medium text-slate-900">
                        {permit.permitNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-900">
                        {permit.title}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-600">
                        {permit.contractorName || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-600">
                        {getWorkTypeLabel(permit.workType)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(permit.status)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-500">
                        {new Date(permit.createdAt).toLocaleString("zh-CN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-500">
            共 {permits.length} 条记录
          </p>
        </div>
      </div>
    </div>
  );
}
