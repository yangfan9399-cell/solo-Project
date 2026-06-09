import { useState } from "react";
import { Form, redirect, useLoaderData, useNavigation, useActionData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { db } from "~/db";
import {
  contractors,
  workZones,
  workers,
  certificates,
  workPermits,
  permitWorkers,
  riskItems,
  approvalNodes,
} from "~/db/schema";
import { desc } from "drizzle-orm";

export const meta: MetaFunction = () => {
  return [{ title: "新建作业许可证 - 舞台搭建进场系统" }];
};

type WorkerWithCertificates = typeof workers.$inferSelect & {
  certificates: (typeof certificates.$inferSelect)[];
};

export async function loader() {
  const contractorList = await db
    .select()
    .from(contractors)
    .orderBy(desc(contractors.createdAt));

  const zoneList = await db
    .select()
    .from(workZones)
    .orderBy(desc(workZones.createdAt));

  const workerList = await db
    .select()
    .from(workers)
    .orderBy(desc(workers.createdAt));

  const certificateList = await db.select().from(certificates);

  const workersWithCerts: WorkerWithCertificates[] = workerList.map((worker) => ({
    ...worker,
    certificates: certificateList.filter((cert) => cert.workerId === worker.id),
  }));

  return {
    contractors: contractorList,
    workZones: zoneList,
    workers: workersWithCerts,
  };
}

const workTypeOptions = [
  { value: "stage_setup", label: "舞台搭建" },
  { value: "lighting_install", label: "灯光安装" },
  { value: "sound_install", label: "音响安装" },
  { value: "truss_hoisting", label: "桁架吊装" },
  { value: "scaffolding", label: "脚手架搭建" },
  { value: "electrical", label: "电气作业" },
  { value: "general", label: "综合作业" },
];

const riskLevelOptions = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
  { value: "critical", label: "极高" },
];

const certificateTypeLabels: Record<string, string> = {
  height_work: "高空作业",
  electrician: "电工证",
  welding: "焊接证",
  crane_operator: "起重机操作证",
  scaffolding: "脚手架证",
  first_aid: "急救证",
  fire_safety: "消防安全证",
};

interface RiskItemForm {
  id: string;
  title: string;
  description: string;
  level: string;
  mitigation: string;
}

interface ActionData {
  success?: boolean;
  error?: string;
  errors?: Record<string, string>;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const title = formData.get("title") as string;
  const contractorId = formData.get("contractorId") as string;
  const workType = formData.get("workType") as string;
  const workZoneId = formData.get("workZoneId") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const isNightWork = formData.get("isNightWork") === "on";
  const nightPermitNumber = formData.get("nightPermitNumber") as string;
  const description = formData.get("description") as string;

  const workerIds = formData.getAll("workerIds") as string[];
  const riskTitles = formData.getAll("riskTitle") as string[];
  const riskDescriptions = formData.getAll("riskDescription") as string[];
  const riskLevels = formData.getAll("riskLevel") as string[];
  const riskMitigations = formData.getAll("riskMitigation") as string[];

  const errors: Record<string, string> = {};

  if (!title?.trim()) {
    errors.title = "请输入许可证标题";
  }
  if (!contractorId) {
    errors.contractorId = "请选择承包商";
  }
  if (!workType) {
    errors.workType = "请选择作业类型";
  }
  if (!workZoneId) {
    errors.workZoneId = "请选择施工区域";
  }
  if (!startTime) {
    errors.startTime = "请选择作业开始时间";
  }
  if (!endTime) {
    errors.endTime = "请选择作业结束时间";
  }
  if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
    errors.endTime = "结束时间必须晚于开始时间";
  }
  if (isNightWork && !nightPermitNumber?.trim()) {
    errors.nightPermitNumber = "夜间施工请填写夜间施工许可证号";
  }
  if (workerIds.length === 0) {
    errors.workerIds = "请至少选择一名作业人员";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors } as ActionData;
  }

  try {
    const permitNumber = `WP-${Date.now().toString().slice(-8)}`;

    const newPermit = await db
      .insert(workPermits)
      .values({
        permitNumber,
        title: title.trim(),
        contractorId: parseInt(contractorId),
        workType: workType as any,
        workZoneId: parseInt(workZoneId),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isNightWork,
        nightPermitNumber: nightPermitNumber?.trim() || null,
        description: description?.trim() || null,
        status: "submitted",
        submittedAt: new Date(),
      })
      .returning();

    const permitId = newPermit[0].id;

    if (workerIds.length > 0) {
      await db.insert(permitWorkers).values(
        workerIds.map((workerId) => ({
          permitId,
          workerId: parseInt(workerId),
        }))
      );
    }

    if (riskTitles.length > 0) {
      const riskItemsToInsert = riskTitles
        .map((title, index) => ({
          permitId,
          title: title.trim(),
          description: riskDescriptions[index]?.trim() || null,
          level: riskLevels[index] || "medium",
          mitigation: riskMitigations[index]?.trim() || null,
        }))
        .filter((item) => item.title);

      if (riskItemsToInsert.length > 0) {
        await db.insert(riskItems).values(riskItemsToInsert);
      }
    }

    await db.insert(approvalNodes).values({
      permitId,
      role: "security",
      action: "pending",
      status: "submitted",
      comment: "已提交，等待安保核验",
      operatorName: "系统",
    });

    return redirect(`/permits/${permitId}`);
  } catch (error) {
    console.error("创建作业许可证失败:", error);
    return { success: false, error: "创建失败，请稍后重试" } as ActionData;
  }
}

export default function NewPermit() {
  const { contractors, workZones, workers } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();

  const [selectedContractor, setSelectedContractor] = useState<string>("");
  const [isNightWork, setIsNightWork] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [riskItemsList, setRiskItemsList] = useState<RiskItemForm[]>([
    { id: "1", title: "", description: "", level: "medium", mitigation: "" },
  ]);

  const isSubmitting = navigation.state === "submitting";

  const filteredWorkers = selectedContractor
    ? workers.filter((w) => w.contractorId === parseInt(selectedContractor))
    : [];

  const toggleWorker = (workerId: string) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  };

  const addRiskItem = () => {
    const newId = (riskItemsList.length + 1).toString();
    setRiskItemsList((prev) => [
      ...prev,
      { id: newId, title: "", description: "", level: "medium", mitigation: "" },
    ]);
  };

  const removeRiskItem = (id: string) => {
    if (riskItemsList.length > 1) {
      setRiskItemsList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const fieldErrors = (actionData as ActionData)?.errors || {};

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">新建作业许可证</h1>
        <p className="text-slate-500 mt-1">填写作业申请信息，提交后进入审批流程</p>
      </div>

      <Form method="post" className="space-y-6">
        {(actionData as ActionData)?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {(actionData as ActionData).error}
          </div>
        )}

        <div className="card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-3">
            基本信息
          </h2>

          <div>
            <label className="label">
              许可证标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              className={`input ${fieldErrors.title ? "border-red-500" : ""}`}
              placeholder="请输入许可证标题"
            />
            {fieldErrors.title && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                承包商 <span className="text-red-500">*</span>
              </label>
              <select
                name="contractorId"
                value={selectedContractor}
                onChange={(e) => {
                  setSelectedContractor(e.target.value);
                  setSelectedWorkers([]);
                }}
                className={`input ${fieldErrors.contractorId ? "border-red-500" : ""}`}
              >
                <option value="">请选择承包商</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.contractorId && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.contractorId}</p>
              )}
            </div>

            <div>
              <label className="label">
                作业类型 <span className="text-red-500">*</span>
              </label>
              <select
                name="workType"
                className={`input ${fieldErrors.workType ? "border-red-500" : ""}`}
              >
                <option value="">请选择作业类型</option>
                {workTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {fieldErrors.workType && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.workType}</p>
              )}
            </div>
          </div>

          <div>
            <label className="label">
              施工区域 <span className="text-red-500">*</span>
            </label>
            <select
              name="workZoneId"
              className={`input ${fieldErrors.workZoneId ? "border-red-500" : ""}`}
            >
              <option value="">请选择施工区域</option>
              {workZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.code} - {zone.name}
                  {zone.isHighRisk ? " (高风险)" : ""}
                </option>
              ))}
            </select>
            {fieldErrors.workZoneId && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.workZoneId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                开始时间 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="startTime"
                className={`input ${fieldErrors.startTime ? "border-red-500" : ""}`}
              />
              {fieldErrors.startTime && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.startTime}</p>
              )}
            </div>

            <div>
              <label className="label">
                结束时间 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="endTime"
                className={`input ${fieldErrors.endTime ? "border-red-500" : ""}`}
              />
              {fieldErrors.endTime && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.endTime}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="isNightWork"
              name="isNightWork"
              checked={isNightWork}
              onChange={(e) => setIsNightWork(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <label htmlFor="isNightWork" className="label cursor-pointer">
                夜间施工
              </label>
              <p className="text-sm text-slate-500">
                勾选表示作业涉及夜间时段（22:00 - 次日6:00）
              </p>
            </div>
          </div>

          {isNightWork && (
            <div>
              <label className="label">
                夜间施工许可证号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nightPermitNumber"
                className={`input ${fieldErrors.nightPermitNumber ? "border-red-500" : ""}`}
                placeholder="请输入夜间施工许可证号"
              />
              {fieldErrors.nightPermitNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {fieldErrors.nightPermitNumber}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="label">作业描述</label>
            <textarea
              name="description"
              rows={4}
              className="input resize-none"
              placeholder="请详细描述作业内容、范围和要求"
            />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-lg font-semibold text-slate-900">作业人员</h2>
            <span className="text-sm text-slate-500">
              已选择 {selectedWorkers.length} 人
            </span>
          </div>

          {fieldErrors.workerIds && (
            <p className="text-red-500 text-sm">{fieldErrors.workerIds}</p>
          )}

          {!selectedContractor ? (
            <div className="text-center py-8 text-slate-500">
              请先选择承包商，然后选择作业人员
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              该承包商暂无作业人员
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredWorkers.map((worker) => (
                <div
                  key={worker.id}
                  onClick={() => toggleWorker(worker.id.toString())}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedWorkers.includes(worker.id.toString())
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="workerIds"
                      value={worker.id}
                      checked={selectedWorkers.includes(worker.id.toString())}
                      onChange={() => toggleWorker(worker.id.toString())}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {worker.name}
                        </span>
                        <span className="text-sm text-slate-500">
                          {worker.idNumber}
                        </span>
                      </div>
                      {worker.certificates.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {worker.certificates.map((cert) => (
                            <span
                              key={cert.id}
                              className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full"
                            >
                              {certificateTypeLabels[cert.type] || cert.type}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-lg font-semibold text-slate-900">风险清单</h2>
            <button
              type="button"
              onClick={addRiskItem}
              className="btn btn-secondary text-sm"
            >
              + 添加风险项
            </button>
          </div>

          <div className="space-y-4">
            {riskItemsList.map((item, index) => (
              <div
                key={item.id}
                className="p-4 border border-slate-200 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">
                    风险项 {index + 1}
                  </span>
                  {riskItemsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRiskItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="label">风险标题</label>
                    <input
                      type="text"
                      name="riskTitle"
                      defaultValue={item.title}
                      className="input"
                      placeholder="请输入风险项标题"
                    />
                  </div>

                  <div>
                    <label className="label">风险等级</label>
                    <select
                      name="riskLevel"
                      defaultValue={item.level}
                      className="input"
                    >
                      {riskLevelOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">风险描述</label>
                    <textarea
                      name="riskDescription"
                      defaultValue={item.description}
                      rows={2}
                      className="input resize-none"
                      placeholder="请描述风险内容"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">缓解措施</label>
                    <textarea
                      name="riskMitigation"
                      defaultValue={item.mitigation}
                      rows={2}
                      className="input resize-none"
                      placeholder="请描述风险缓解措施"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => window.history.back()}
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
            {isSubmitting ? "提交中..." : "提交申请"}
          </button>
        </div>
      </Form>
    </div>
  );
}
