import { useState, useEffect } from "react";
import { Form, useLoaderData, useSearchParams, useActionData, useNavigation } from "react-router";
import type { MetaFunction, ActionFunctionArgs } from "react-router";
import { db } from "~/db";
import { contractors, workers, workPermits } from "~/db/schema";
import { eq, like, desc, and, sql, inArray } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export const meta: MetaFunction = () => {
  return [{ title: "承包商管理 - 舞台搭建进场系统" }];
};

type ContractorWithStats = InferSelectModel<typeof contractors> & {
  workerCount: number;
  permitCount: number;
};

type ContractorDetail = {
  workers: (typeof workers.$inferSelect)[];
  recentPermits: (typeof workPermits.$inferSelect)[];
};

interface ActionData {
  success?: boolean;
  error?: string;
  errors?: Record<string, string>;
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search");

  const conditions = [];

  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(like(contractors.name, searchPattern));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const contractorList = await db
    .select({
      id: contractors.id,
      name: contractors.name,
      contactPerson: contractors.contactPerson,
      phone: contractors.phone,
      email: contractors.email,
      licenseNumber: contractors.licenseNumber,
      createdAt: contractors.createdAt,
      workerCount: sql<number>`COALESCE((SELECT COUNT(*) FROM ${workers} WHERE ${workers.contractorId} = ${contractors.id}), 0)`.as("worker_count"),
      permitCount: sql<number>`COALESCE((SELECT COUNT(*) FROM ${workPermits} WHERE ${workPermits.contractorId} = ${contractors.id}), 0)`.as("permit_count"),
    })
    .from(contractors)
    .where(whereClause)
    .orderBy(desc(contractors.createdAt));

  const contractorIds = contractorList.map((c) => c.id);

  let allWorkers: (typeof workers.$inferSelect)[] = [];
  let allPermits: (typeof workPermits.$inferSelect)[] = [];

  if (contractorIds.length > 0) {
    allWorkers = await db
      .select()
      .from(workers)
      .where(inArray(workers.contractorId, contractorIds))
      .orderBy(desc(workers.createdAt));

    allPermits = await db
      .select()
      .from(workPermits)
      .where(inArray(workPermits.contractorId, contractorIds))
      .orderBy(desc(workPermits.createdAt));
  }

  const details: Record<number, ContractorDetail> = {};
  for (const contractor of contractorList) {
    details[contractor.id] = {
      workers: allWorkers.filter((w) => w.contractorId === contractor.id),
      recentPermits: allPermits
        .filter((p) => p.contractorId === contractor.id)
        .slice(0, 5),
    };
  }

  return {
    contractors: contractorList as ContractorWithStats[],
    details,
    filters: {
      search,
    },
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const name = formData.get("name") as string;
  const contactPerson = formData.get("contactPerson") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const licenseNumber = formData.get("licenseNumber") as string;

  const errors: Record<string, string> = {};

  if (!name?.trim()) {
    errors.name = "请输入公司名称";
  }
  if (!contactPerson?.trim()) {
    errors.contactPerson = "请输入联系人姓名";
  }
  if (!phone?.trim()) {
    errors.phone = "请输入联系电话";
  }
  if (!email?.trim()) {
    errors.email = "请输入邮箱地址";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "请输入有效的邮箱地址";
  }
  if (!licenseNumber?.trim()) {
    errors.licenseNumber = "请输入资质证号";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors } as ActionData;
  }

  try {
    await db.insert(contractors).values({
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      licenseNumber: licenseNumber.trim(),
    });

    return { success: true } as ActionData;
  } catch (error) {
    console.error("创建承包商失败:", error);
    return { success: false, error: "创建失败，请稍后重试" } as ActionData;
  }
}

function getPermitStatusBadge(status: string) {
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

export default function Contractors() {
  const { contractors: contractorList, details, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const isSubmitting = navigation.state === "submitting";
  const fieldErrors = (actionData as ActionData)?.errors || {};

  useEffect(() => {
    if ((actionData as ActionData)?.success) {
      setShowAddModal(false);
    }
  }, [actionData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) {
      newParams.set("search", e.target.value);
    } else {
      newParams.delete("search");
    }
    setSearchParams(newParams);
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">承包商管理</h1>
          <p className="text-slate-500 mt-1">管理所有合作承包商及其人员信息</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          + 添加承包商
        </button>
      </div>

      <div className="card">
        <div className="p-5 border-b border-slate-200">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="label">搜索</label>
              <input
                type="text"
                className="input"
                placeholder="搜索公司名称..."
                value={filters.search || ""}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-10"></th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  公司名称
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  联系人
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  联系电话
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  邮箱
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  资质证号
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  人员数量
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  许可证数量
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {contractorList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    暂无承包商记录
                  </td>
                </tr>
              ) : (
                contractorList.map((contractor) => (
                  <>
                    <tr
                      key={contractor.id}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => toggleExpand(contractor.id)}
                    >
                      <td className="px-5 py-4">
                        <svg
                          className={`w-5 h-5 text-slate-400 transition-transform ${
                            expandedId === contractor.id ? "rotate-90" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-slate-900">
                          {contractor.name}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600">
                          {contractor.contactPerson}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600">
                          {contractor.phone || "-"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600">
                          {contractor.email || "-"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-mono text-slate-600">
                          {contractor.licenseNumber || "-"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                          {contractor.workerCount}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                          {contractor.permitCount}
                        </span>
                      </td>
                    </tr>
                    {expandedId === contractor.id && details[contractor.id] && (
                      <tr>
                        <td colSpan={8} className="px-5 py-5 bg-slate-50">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg border border-slate-200 p-5">
                              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                                人员列表
                              </h3>
                              {details[contractor.id].workers.length === 0 ? (
                                <p className="text-sm text-slate-500">暂无人员</p>
                              ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                  {details[contractor.id].workers.map((worker) => (
                                    <div
                                      key={worker.id}
                                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                                    >
                                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                                        {worker.name.charAt(0)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                          {worker.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          {worker.idNumber}
                                        </p>
                                      </div>
                                      {worker.phone && (
                                        <span className="text-xs text-slate-500">
                                          {worker.phone}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="bg-white rounded-lg border border-slate-200 p-5">
                              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                                最近作业许可证
                              </h3>
                              {details[contractor.id].recentPermits.length === 0 ? (
                                <p className="text-sm text-slate-500">暂无作业许可证</p>
                              ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                  {details[contractor.id].recentPermits.map((permit) => (
                                    <div
                                      key={permit.id}
                                      className="p-3 bg-slate-50 rounded-lg"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-mono text-slate-500">
                                          {permit.permitNumber}
                                        </span>
                                        {getPermitStatusBadge(permit.status)}
                                      </div>
                                      <p className="text-sm font-medium text-slate-900 truncate">
                                        {permit.title}
                                      </p>
                                      <p className="text-xs text-slate-500 mt-1">
                                        {new Date(permit.startTime).toLocaleDateString(
                                          "zh-CN"
                                        )}{" "}
                                        -{" "}
                                        {new Date(permit.endTime).toLocaleDateString(
                                          "zh-CN"
                                        )}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-500">
            共 {contractorList.length} 条记录
          </p>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">添加承包商</h2>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <Form method="post" className="p-6 space-y-4">
              {(actionData as ActionData)?.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {(actionData as ActionData).error}
                </div>
              )}

              <div>
                <label className="label">
                  公司名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className={`input ${fieldErrors.name ? "border-red-500" : ""}`}
                  placeholder="请输入公司名称"
                />
                {fieldErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="label">
                  联系人 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  className={`input ${fieldErrors.contactPerson ? "border-red-500" : ""}`}
                  placeholder="请输入联系人姓名"
                />
                {fieldErrors.contactPerson && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.contactPerson}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    联系电话 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className={`input ${fieldErrors.phone ? "border-red-500" : ""}`}
                    placeholder="请输入联系电话"
                  />
                  {fieldErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="label">
                    邮箱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className={`input ${fieldErrors.email ? "border-red-500" : ""}`}
                    placeholder="请输入邮箱"
                  />
                  {fieldErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="label">
                  资质证号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  className={`input ${fieldErrors.licenseNumber ? "border-red-500" : ""}`}
                  placeholder="请输入资质证号"
                />
                {fieldErrors.licenseNumber && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.licenseNumber}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "添加中..." : "添加"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
