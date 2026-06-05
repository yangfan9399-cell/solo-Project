import { useState, useEffect } from "react";
import { useLoaderData, useNavigate, Form, redirect, useOutletContext, useFetcher } from "react-router";
import { getTeams, getAreas, createPermit } from "~/lib/services";
import { CONSTRUCTION_TYPES, type UserRole } from "~/lib/utils";
import type { Worker } from "~/lib/types";

export const loader = async () => {
  const teams = await getTeams();
  const areas = await getAreas();
  return { teams, areas };
};

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();

  const teamId = parseInt(formData.get("teamId") as string);
  const areaId = parseInt(formData.get("areaId") as string);
  const constructionType = formData.get("constructionType") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const workContent = formData.get("workContent") as string;
  const hasDocuments = formData.get("hasDocuments") === "on";
  const documentMissingReason = formData.get("documentMissingReason") as string;
  const workerIds = (formData.getAll("workerIds") as string[]).map(Number);

  const permit = await createPermit({
    teamId,
    areaId,
    constructionType,
    startDate,
    endDate,
    startTime,
    endTime,
    workContent,
    workerIds,
    hasDocuments,
    documentMissingReason: hasDocuments ? undefined : documentMissingReason,
  });

  return redirect(`/permits/${permit.id}`);
};

export default function NewPermit() {
  const { teams, areas } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { currentRole } = useOutletContext<{ currentRole: UserRole }>();

  const workersFetcher = useFetcher<{ workers: Worker[] }>();
  const conflictFetcher = useFetcher<{
    hasConflict: boolean;
    conflictingPermits: any[];
    error?: string;
  }>();

  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);
  const [hasDocuments, setHasDocuments] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [teamWorkers, setTeamWorkers] = useState<Worker[]>([]);
  const [conflictCheck, setConflictCheck] = useState<{
    hasConflict: boolean;
    conflictingPermits: any[];
  } | null>(null);

  const isLoadingWorkers = workersFetcher.state === "loading";
  const isCheckingConflict = conflictFetcher.state === "submitting";

  useEffect(() => {
    if (workersFetcher.data?.workers) {
      setTeamWorkers(workersFetcher.data.workers);
    }
  }, [workersFetcher.data]);

  useEffect(() => {
    if (conflictFetcher.data && !conflictFetcher.data.error) {
      setConflictCheck({
        hasConflict: conflictFetcher.data.hasConflict,
        conflictingPermits: conflictFetcher.data.conflictingPermits,
      });
    }
  }, [conflictFetcher.data]);

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId);
    setSelectedWorkers([]);
    setTeamWorkers([]);
    if (teamId) {
      workersFetcher.load(`/resources/workers-by-team?teamId=${teamId}`);
    }
  };

  const toggleWorker = (workerId: number) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  };

  const checkConflict = () => {
    if (!selectedArea || !startDate || !endDate) return;
    const formData = new FormData();
    formData.append("areaId", selectedArea);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    conflictFetcher.submit(formData, {
      method: "post",
      action: "/resources/check-area-conflict",
    });
  };

  const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/permits")}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← 返回列表
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">新建施工许可</h1>
            <p className="text-slate-500 mt-1">填写施工队信息和施工详情，提交审核</p>
          </div>
        </div>
      </div>

      {currentRole !== "SECURITY_OFFICER" && (
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
          <p className="text-warning-800">
            ⚠️ 只有安保经办人可以创建施工许可申请。当前角色为
            {currentRole === "ENGINEERING_MANAGER" ? "工程负责人" : "安全复核人"}。
          </p>
        </div>
      )}

      <Form method="post" className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span>👷</span>施工队信息
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">施工队 <span className="text-danger-500">*</span></label>
              <select
                name="teamId"
                className="input"
                value={selectedTeam}
                onChange={(e) => handleTeamChange(e.target.value)}
                required
                disabled={currentRole !== "SECURITY_OFFICER"}
              >
                <option value="">请选择施工队</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} - {team.company}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {teamWorkers.length > 0 && (
            <div className="mt-4">
              <label className="label">
                施工人员 <span className="text-slate-400 text-xs">（已选{selectedWorkers.length}人）</span>
              </label>
              <div className="border border-slate-200 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                {teamWorkers.map((worker) => (
                  <label
                    key={worker.id}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="workerIds"
                      value={worker.id}
                      checked={selectedWorkers.includes(worker.id)}
                      onChange={() => toggleWorker(worker.id)}
                      className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{worker.name}</p>
                      <p className="text-xs text-slate-500">{worker.idCard}</p>
                    </div>
                    <div>
                      {worker.hasSafetyCert ? (
                        <span className="badge-success">有安全证</span>
                      ) : (
                        <span className="badge-danger">无安全证</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {isLoadingWorkers && (
            <div className="mt-4 text-center text-slate-400 text-sm">
              加载施工人员中...
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span>📍</span>施工信息
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">施工类型 <span className="text-danger-500">*</span></label>
              <select name="constructionType" className="input" required disabled={currentRole !== "SECURITY_OFFICER"}>
                <option value="">请选择施工类型</option>
                {CONSTRUCTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">施工区域 <span className="text-danger-500">*</span></label>
              <select
                name="areaId"
                className="input"
                value={selectedArea}
                onChange={(e) => {
                  setSelectedArea(e.target.value);
                  setConflictCheck(null);
                }}
                required
                disabled={currentRole !== "SECURITY_OFFICER"}
              >
                <option value="">请选择施工区域</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} ({area.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">开始日期 <span className="text-danger-500">*</span></label>
              <input
                type="date"
                name="startDate"
                className="input"
                value={startDate}
                min={getToday()}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setConflictCheck(null);
                }}
                required
                disabled={currentRole !== "SECURITY_OFFICER"}
              />
            </div>
            <div>
              <label className="label">结束日期 <span className="text-danger-500">*</span></label>
              <input
                type="date"
                name="endDate"
                className="input"
                value={endDate}
                min={startDate || getToday()}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setConflictCheck(null);
                }}
                required
                disabled={currentRole !== "SECURITY_OFFICER"}
              />
            </div>
            <div>
              <label className="label">每日开始时间 <span className="text-danger-500">*</span></label>
              <input
                type="time"
                name="startTime"
                className="input"
                defaultValue="08:00"
                required
                disabled={currentRole !== "SECURITY_OFFICER"}
              />
            </div>
            <div>
              <label className="label">每日结束时间 <span className="text-danger-500">*</span></label>
              <input
                type="time"
                name="endTime"
                className="input"
                defaultValue="18:00"
                required
                disabled={currentRole !== "SECURITY_OFFICER"}
              />
            </div>
            <div className="col-span-2">
              <label className="label">施工内容 <span className="text-danger-500">*</span></label>
              <textarea
                name="workContent"
                className="input h-24"
                placeholder="请详细描述施工内容..."
                required
                disabled={currentRole !== "SECURITY_OFFICER"}
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={checkConflict}
              disabled={!selectedArea || !startDate || !endDate || isCheckingConflict}
              className="btn-secondary"
            >
              {isCheckingConflict ? "检测中..." : "🔍 检测区域冲突"}
            </button>
          </div>

          {conflictCheck && (
            <div
              className={`mt-4 rounded-lg p-4 ${
                conflictCheck.hasConflict
                  ? "bg-danger-50 border border-danger-200"
                  : "bg-success-50 border border-success-200"
              }`}
            >
              {conflictCheck.hasConflict ? (
                <div>
                  <p className="font-semibold text-danger-800 flex items-center gap-2">
                    <span>⚠️</span>检测到区域冲突！
                  </p>
                  <p className="text-sm text-danger-700 mt-1">
                    该时间段已有 {conflictCheck.conflictingPermits.length} 个施工许可安排在此区域
                  </p>
                  <ul className="mt-2 space-y-1">
                    {conflictCheck.conflictingPermits.map((p) => (
                      <li key={p.id} className="text-sm text-danger-600">
                        • {p.permitNumber} ({p.startDate} ~ {p.endDate})
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-danger-600 mt-2">
                    提示：您仍可提交申请，但工程负责人审核时会标记冲突并要求调整
                  </p>
                </div>
              ) : (
                <p className="font-medium text-success-800 flex items-center gap-2">
                  <span>✅</span>该区域该时间段可用
                </p>
              )}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span>📎</span>证件资料
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="hasDocuments"
                checked={hasDocuments}
                onChange={(e) => setHasDocuments(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                disabled={currentRole !== "SECURITY_OFFICER"}
              />
              <span className="text-sm font-medium text-slate-700">证件资料齐全</span>
            </label>

            {!hasDocuments && (
              <div>
                <label className="label">证件缺失说明</label>
                <textarea
                  name="documentMissingReason"
                  className="input h-24"
                  placeholder="请说明缺少哪些证件..."
                  disabled={currentRole !== "SECURITY_OFFICER"}
                />
              </div>
            )}

            {!hasDocuments && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <p className="text-sm text-warning-700">
                  ⚠️ 证件不齐全的申请将被标记为「待补证件」状态，需补齐后才能进入后续审批流程
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/permits")}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={currentRole !== "SECURITY_OFFICER"}
          >
            提交申请
          </button>
        </div>
      </Form>
    </div>
  );
}
