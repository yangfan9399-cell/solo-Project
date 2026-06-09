import { useState } from "react";
import {
  Form,
  useLoaderData,
  useSearchParams,
  useActionData,
  useNavigation,
} from "react-router";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import { db } from "~/db";
import { workers, contractors, certificates } from "~/db/schema";
import { sql, eq, and, or, desc, count } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export const meta: MetaFunction = () => {
  return [{ title: "施工人员管理 - 舞台搭建进场系统" }];
};

type WorkerWithContractorAndCertCount = InferSelectModel<typeof workers> & {
  contractorName: string | null;
  certificateCount: number;
};

type CertificateWithWorker = InferSelectModel<typeof certificates>;

interface ActionData {
  success?: boolean;
  error?: string;
  errors?: Record<string, string>;
  actionType?: string;
}

const certificateTypeLabels: Record<string, string> = {
  height_work: "登高证",
  electrician: "电工证",
  welding: "焊工证",
  crane_operator: "起重作业证",
  scaffolding: "脚手架证",
  first_aid: "急救证",
  fire_safety: "消防安全证",
};

const certificateTypeOptions = [
  { value: "height_work", label: "登高证" },
  { value: "electrician", label: "电工证" },
  { value: "welding", label: "焊工证" },
  { value: "crane_operator", label: "起重作业证" },
  { value: "scaffolding", label: "脚手架证" },
  { value: "first_aid", label: "急救证" },
  { value: "fire_safety", label: "消防安全证" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const contractorId = url.searchParams.get("contractorId");
  const search = url.searchParams.get("search");

  const conditions = [];

  if (contractorId) {
    conditions.push(eq(workers.contractorId, parseInt(contractorId)));
  }

  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        sql`${workers.name} ILIKE ${searchPattern}`,
        sql`${workers.idNumber} ILIKE ${searchPattern}`
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const certCountSubquery = db
    .select({
      workerId: certificates.workerId,
      certCount: count(certificates.id).as("cert_count"),
    })
    .from(certificates)
    .groupBy(certificates.workerId)
    .as("cert_counts");

  const workerList = await db
    .select({
      id: workers.id,
      name: workers.name,
      idNumber: workers.idNumber,
      phone: workers.phone,
      contractorId: workers.contractorId,
      createdAt: workers.createdAt,
      contractorName: contractors.name,
      certificateCount: sql<number>`COALESCE(${certCountSubquery.certCount}, 0)`,
    })
    .from(workers)
    .leftJoin(contractors, eq(workers.contractorId, contractors.id))
    .leftJoin(certCountSubquery, eq(workers.id, certCountSubquery.workerId))
    .where(whereClause)
    .orderBy(desc(workers.createdAt));

  const contractorList = await db
    .select({
      id: contractors.id,
      name: contractors.name,
    })
    .from(contractors)
    .orderBy(contractors.name);

  const allCertificates = await db.select().from(certificates);

  return {
    workers: workerList as WorkerWithContractorAndCertCount[],
    contractors: contractorList,
    certificates: allCertificates as CertificateWithWorker[],
    filters: {
      contractorId,
      search,
    },
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  if (actionType === "addWorker") {
    return handleAddWorker(formData);
  }

  if (actionType === "addCertificate") {
    return handleAddCertificate(formData);
  }

  return { success: false, error: "未知操作类型" } as ActionData;
}

async function handleAddWorker(formData: FormData): Promise<ActionData> {
  const name = formData.get("name") as string;
  const idNumber = formData.get("idNumber") as string;
  const phone = formData.get("phone") as string;
  const contractorId = formData.get("contractorId") as string;

  const errors: Record<string, string> = {};

  if (!name?.trim()) {
    errors.name = "请输入姓名";
  }
  if (!idNumber?.trim()) {
    errors.idNumber = "请输入身份证号";
  }
  if (!phone?.trim()) {
    errors.phone = "请输入手机号";
  }
  if (!contractorId) {
    errors.contractorId = "请选择所属承包商";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors, actionType: "addWorker" };
  }

  try {
    const existing = await db
      .select()
      .from(workers)
      .where(eq(workers.idNumber, idNumber.trim()));

    if (existing.length > 0) {
      return {
        success: false,
        error: "该身份证号已存在",
        actionType: "addWorker",
      };
    }

    await db.insert(workers).values({
      name: name.trim(),
      idNumber: idNumber.trim(),
      phone: phone.trim(),
      contractorId: parseInt(contractorId),
    });

    return { success: true, actionType: "addWorker" };
  } catch (error) {
    console.error("添加工人失败:", error);
    return { success: false, error: "添加失败，请稍后重试", actionType: "addWorker" };
  }
}

async function handleAddCertificate(formData: FormData): Promise<ActionData> {
  const workerId = formData.get("workerId") as string;
  const type = formData.get("certType") as string;
  const certificateNumber = formData.get("certificateNumber") as string;
  const issueDate = formData.get("issueDate") as string;
  const expiryDate = formData.get("expiryDate") as string;
  const issuingAuthority = formData.get("issuingAuthority") as string;

  const errors: Record<string, string> = {};

  if (!workerId) {
    errors.workerId = "请选择人员";
  }
  if (!type) {
    errors.certType = "请选择证书类型";
  }
  if (!certificateNumber?.trim()) {
    errors.certificateNumber = "请输入证书编号";
  }
  if (!issueDate) {
    errors.issueDate = "请选择发证日期";
  }
  if (!expiryDate) {
    errors.expiryDate = "请选择有效期";
  }
  if (issueDate && expiryDate && new Date(issueDate) >= new Date(expiryDate)) {
    errors.expiryDate = "有效期必须晚于发证日期";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors, actionType: "addCertificate" };
  }

  try {
    await db.insert(certificates).values({
      workerId: parseInt(workerId),
      type: type as any,
      certificateNumber: certificateNumber.trim(),
      issueDate: issueDate,
      expiryDate: expiryDate,
      issuingAuthority: issuingAuthority?.trim() || null,
    });

    return { success: true, actionType: "addCertificate" };
  } catch (error) {
    console.error("添加证书失败:", error);
    return { success: false, error: "添加失败，请稍后重试", actionType: "addCertificate" };
  }
}

function isCertificateExpired(expiryDate: string | Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return expiry < today;
}

function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function Workers() {
  const { workers, contractors, certificates, filters } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const [expandedWorkerId, setExpandedWorkerId] = useState<number | null>(null);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);

  const isSubmitting = navigation.state === "submitting";

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

  const toggleExpand = (workerId: number) => {
    setExpandedWorkerId(expandedWorkerId === workerId ? null : workerId);
  };

  const openAddCertModal = (workerId: number) => {
    setSelectedWorkerId(workerId);
    setShowAddCertModal(true);
  };

  const getWorkerCertificates = (workerId: number) => {
    return certificates.filter((cert) => cert.workerId === workerId);
  };

  const addWorkerErrors =
    (actionData as ActionData)?.actionType === "addWorker"
      ? (actionData as ActionData).errors || {}
      : {};

  const addCertErrors =
    (actionData as ActionData)?.actionType === "addCertificate"
      ? (actionData as ActionData).errors || {}
      : {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">施工人员管理</h1>
          <p className="text-slate-500 mt-1">管理所有施工人员及其资质证书</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddWorkerModal(true)}
          className="btn btn-primary"
        >
          + 添加人员
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
                placeholder="搜索姓名或身份证号..."
                value={filters.search || ""}
                onChange={handleSearchChange}
              />
            </div>
            <div className="w-56">
              <label className="label">所属承包商</label>
              <select
                className="input"
                value={filters.contractorId || ""}
                onChange={handleContractorChange}
              >
                <option value="">全部承包商</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {workers.length === 0 ? (
            <div className="px-5 py-12 text-center text-slate-500">
              暂无施工人员记录
            </div>
          ) : (
            workers.map((worker) => (
              <div key={worker.id}>
                <div
                  className="px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => toggleExpand(worker.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {worker.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-slate-900">
                            {worker.name}
                          </span>
                          <span className="text-sm text-slate-500">
                            {worker.idNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-slate-600">
                            {worker.contractorName || "-"}
                          </span>
                          <span className="text-sm text-slate-500">
                            {worker.phone || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="badge badge-info">
                        {worker.certificateCount} 个证书
                      </span>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform ${
                          expandedWorkerId === worker.id ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {expandedWorkerId === worker.id && (
                  <div className="bg-slate-50 px-5 py-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-900">
                        资质证书
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddCertModal(worker.id);
                        }}
                        className="btn btn-secondary text-sm"
                      >
                        + 添加证书
                      </button>
                    </div>

                    {getWorkerCertificates(worker.id).length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-sm">
                        暂无证书记录
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {getWorkerCertificates(worker.id).map((cert) => {
                          const expired = isCertificateExpired(cert.expiryDate);
                          return (
                            <div
                              key={cert.id}
                              className={`p-4 rounded-lg border ${
                                expired
                                  ? "bg-red-50 border-red-200"
                                  : "bg-white border-slate-200"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-medium ${
                                        expired
                                          ? "text-red-700"
                                          : "text-slate-900"
                                      }`}
                                    >
                                      {certificateTypeLabels[cert.type] ||
                                        cert.type}
                                    </span>
                                    {expired && (
                                      <span className="badge badge-danger">
                                        已过期
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-slate-600 mt-1">
                                    证书编号：{cert.certificateNumber}
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                <div>
                                  <span className="text-slate-500">
                                    发证日期：
                                  </span>
                                  <span className="text-slate-700">
                                    {formatDate(cert.issueDate)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500">
                                    有效期至：
                                  </span>
                                  <span
                                    className={
                                      expired
                                        ? "text-red-600 font-medium"
                                        : "text-slate-700"
                                    }
                                  >
                                    {formatDate(cert.expiryDate)}
                                  </span>
                                </div>
                                {cert.issuingAuthority && (
                                  <div className="col-span-2">
                                    <span className="text-slate-500">
                                      发证机关：
                                    </span>
                                    <span className="text-slate-700">
                                      {cert.issuingAuthority}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-500">共 {workers.length} 条记录</p>
        </div>
      </div>

      {showAddWorkerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  添加施工人员
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <Form method="post" className="p-6 space-y-4">
              <input type="hidden" name="actionType" value="addWorker" />

              {(actionData as ActionData)?.actionType === "addWorker" &&
                (actionData as ActionData).error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {(actionData as ActionData).error}
                  </div>
                )}

              <div>
                <label className="label">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className={`input ${addWorkerErrors.name ? "border-red-500" : ""}`}
                  placeholder="请输入姓名"
                />
                {addWorkerErrors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {addWorkerErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="label">
                  身份证号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="idNumber"
                  className={`input ${addWorkerErrors.idNumber ? "border-red-500" : ""}`}
                  placeholder="请输入身份证号"
                />
                {addWorkerErrors.idNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {addWorkerErrors.idNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="label">
                  手机号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  className={`input ${addWorkerErrors.phone ? "border-red-500" : ""}`}
                  placeholder="请输入手机号"
                />
                {addWorkerErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">
                    {addWorkerErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="label">
                  所属承包商 <span className="text-red-500">*</span>
                </label>
                <select
                  name="contractorId"
                  className={`input ${addWorkerErrors.contractorId ? "border-red-500" : ""}`}
                >
                  <option value="">请选择承包商</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {addWorkerErrors.contractorId && (
                  <p className="text-red-500 text-sm mt-1">
                    {addWorkerErrors.contractorId}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
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

      {showAddCertModal && selectedWorkerId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  添加证书
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCertModal(false);
                    setSelectedWorkerId(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <Form method="post" className="p-6 space-y-4">
              <input type="hidden" name="actionType" value="addCertificate" />
              <input type="hidden" name="workerId" value={selectedWorkerId} />

              {(actionData as ActionData)?.actionType === "addCertificate" &&
                (actionData as ActionData).error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {(actionData as ActionData).error}
                  </div>
                )}

              <div>
                <label className="label">
                  证书类型 <span className="text-red-500">*</span>
                </label>
                <select
                  name="certType"
                  className={`input ${addCertErrors.certType ? "border-red-500" : ""}`}
                >
                  <option value="">请选择证书类型</option>
                  {certificateTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {addCertErrors.certType && (
                  <p className="text-red-500 text-sm mt-1">
                    {addCertErrors.certType}
                  </p>
                )}
              </div>

              <div>
                <label className="label">
                  证书编号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="certificateNumber"
                  className={`input ${addCertErrors.certificateNumber ? "border-red-500" : ""}`}
                  placeholder="请输入证书编号"
                />
                {addCertErrors.certificateNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {addCertErrors.certificateNumber}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    发证日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="issueDate"
                    className={`input ${addCertErrors.issueDate ? "border-red-500" : ""}`}
                  />
                  {addCertErrors.issueDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {addCertErrors.issueDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">
                    有效期至 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    className={`input ${addCertErrors.expiryDate ? "border-red-500" : ""}`}
                  />
                  {addCertErrors.expiryDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {addCertErrors.expiryDate}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="label">发证机关</label>
                <input
                  type="text"
                  name="issuingAuthority"
                  className="input"
                  placeholder="请输入发证机关（选填）"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCertModal(false);
                    setSelectedWorkerId(null);
                  }}
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
