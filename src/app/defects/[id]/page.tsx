"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Zap,
  Package,
  Clock,
  User,
  Camera,
  CheckCircle,
  XCircle,
  Play,
  Send,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  X,
  Plus,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  defectStatusLabels,
  defectStatusColors,
  defectLevelLabels,
  defectLevelColors,
  deviceTypeLabels,
  sparePartStatusLabels,
  sparePartStatusColors,
  historyActionLabels,
  formatDate,
  formatDateTime,
  formatDuration,
  cn,
} from "@/lib/utils";
import type {
  Defect,
  PowerStation,
  Device,
  User,
  DefectHistory,
  SparePart,
} from "@/lib/mock-data";

interface DefectDetail extends Defect {
  station?: PowerStation;
  device?: Device;
  inspector?: User;
  assignee?: User;
  reviewer?: User;
  histories: DefectHistory[];
  partsWithStatus?: {
    partId: number;
    partName: string;
    quantity: number;
    status: string;
    availableQuantity: number;
  }[];
}

export default function DefectDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [defect, setDefect] = useState<DefectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showFalsePositiveModal, setShowFalsePositiveModal] = useState(false);
  const [workers, setWorkers] = useState<User[]>([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [processResult, setProcessResult] = useState("");
  const [selectedParts, setSelectedParts] = useState<
    { partId: number; partName: string; quantity: number }[]
  >([]);
  const [reviewComment, setReviewComment] = useState("");
  const [fpComment, setFpComment] = useState("");
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);

  useEffect(() => {
    fetchDefectDetail();
    fetchWorkers();
    fetchSpareParts();
  }, [params.id]);

  const fetchDefectDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/defects/${params.id}`);
      const data = await res.json();
      setDefect(data);
    } catch (error) {
      console.error("获取缺陷详情失败", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await fetch("/api/users?role=maintenance_worker");
      const data = await res.json();
      setWorkers(data);
    } catch (error) {
      console.error("获取检修人员列表失败", error);
    }
  };

  const fetchSpareParts = async () => {
    try {
      const res = await fetch("/api/spare-parts");
      const data = await res.json();
      setSpareParts(data);
    } catch (error) {
      console.error("获取备件列表失败", error);
    }
  };

  const handleAssign = async () => {
    if (!selectedWorker) return;
    try {
      const res = await fetch(`/api/defects/${params.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: parseInt(selectedWorker) }),
      });
      if (res.ok) {
        setShowAssignModal(false);
        fetchDefectDetail();
      }
    } catch (error) {
      console.error("分派失败", error);
    }
  };

  const handleStartProcess = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/defects/${params.id}/start-processing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        fetchDefectDetail();
      }
    } catch (error) {
      console.error("开始处理失败", error);
    }
  };

  const handleSubmitResult = async () => {
    if (!currentUser || !processResult) return;
    try {
      const res = await fetch(`/api/defects/${params.id}/submit-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result: processResult,
          partsNeeded: selectedParts.length > 0 ? selectedParts : undefined,
          userId: currentUser.id,
        }),
      });
      if (res.ok) {
        setShowProcessModal(false);
        setProcessResult("");
        setSelectedParts([]);
        fetchDefectDetail();
      }
    } catch (error) {
      console.error("提交结果失败", error);
    }
  };

  const handleAccept = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/defects/${params.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId: currentUser.id,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setShowReviewModal(false);
        setReviewComment("");
        fetchDefectDetail();
      } else {
        const data = await res.json();
        alert(data.error || "验收失败");
      }
    } catch (error: any) {
      console.error("验收失败", error);
      alert(error.message || "验收失败");
    }
  };

  const handleReject = async () => {
    if (!currentUser || !reviewComment) return;
    try {
      const res = await fetch(`/api/defects/${params.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId: currentUser.id,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setShowReviewModal(false);
        setReviewComment("");
        fetchDefectDetail();
      }
    } catch (error) {
      console.error("退回失败", error);
    }
  };

  const handleMarkFalsePositive = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/defects/${params.id}/false-positive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId: currentUser.id,
          comment: fpComment,
        }),
      });
      if (res.ok) {
        setShowFalsePositiveModal(false);
        setFpComment("");
        fetchDefectDetail();
      }
    } catch (error) {
      console.error("标记误报失败", error);
    }
  };

  const addPart = (part: SparePart) => {
    if (selectedParts.find((p) => p.partId === part.id)) return;
    setSelectedParts([
      ...selectedParts,
      { partId: part.id, partName: part.name, quantity: 1 },
    ]);
  };

  const removePart = (partId: number) => {
    setSelectedParts(selectedParts.filter((p) => p.partId !== partId));
  };

  const updatePartQuantity = (partId: number, quantity: number) => {
    setSelectedParts(
      selectedParts.map((p) =>
        p.partId === partId ? { ...p, quantity } : p
      )
    );
  };

  const canAssign =
    currentUser?.role === "operation_manager" &&
    defect?.status === "registered";
  const canStartProcess =
    currentUser?.role === "maintenance_worker" &&
    (defect?.status === "assigned" || defect?.status === "rejected");
  const canSubmitResult =
    currentUser?.role === "maintenance_worker" &&
    defect?.status === "processing";
  const canReview =
    currentUser?.role === "reviewer" && defect?.status === "pending_review";
  const canMarkFalsePositive =
    (currentUser?.role === "reviewer" ||
      currentUser?.role === "operation_manager") &&
    (defect?.status === "registered" || defect?.status === "assigned");
  const hasOutOfStockParts = defect?.partsWithStatus?.some(
    (p) => p.status === "out_of_stock" || p.availableQuantity < p.quantity
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!defect) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">缺陷不存在</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 p-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">
                {defect.title}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  defectStatusColors[defect.status]
                )}
              >
                {defectStatusLabels[defect.status]}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  defectLevelColors[defect.defectLevel]
                )}
              >
                {defectLevelLabels[defect.defectLevel]}
              </span>
            </div>
            <p className="font-mono text-sm text-gray-500">
              {defect.defectNo}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canAssign && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
              >
                <User className="h-4 w-4" />
                分派任务
              </button>
            )}
            {canStartProcess && (
              <button
                onClick={handleStartProcess}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
              >
                <Play className="h-4 w-4" />
                开始处理
              </button>
            )}
            {canSubmitResult && (
              <button
                onClick={() => setShowProcessModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 transition-colors"
              >
                <Send className="h-4 w-4" />
                提交结果
              </button>
            )}
            {canReview && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                验收
              </button>
            )}
            {canMarkFalsePositive && (
              <button
                onClick={() => setShowFalsePositiveModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                标记误报
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-900">
                缺陷描述
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {defect.description || "暂无描述"}
              </p>
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
                <Camera className="h-4 w-4" />
                缺陷照片
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {defect.photoUrls && defect.photoUrls.length > 0 ? (
                  defect.photoUrls.map((url, index) => (
                    <div
                      key={index}
                      className="aspect-video overflow-hidden rounded-lg bg-gray-100"
                    >
                      <img
                        src={url}
                        alt={`缺陷照片 ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-400">
                    <div className="text-center">
                      <Camera className="mx-auto h-8 w-8" />
                      <p className="mt-2 text-sm">暂无照片</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {defect.processingResult && (
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900">
                  处理结果
                </h3>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {defect.processingResult}
                  </p>
                </div>
                {defect.processingPhotos &&
                  defect.processingPhotos.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {defect.processingPhotos.map((url, index) => (
                        <div
                          key={index}
                          className="aspect-video overflow-hidden rounded-lg bg-gray-100"
                        >
                          <img
                            src={url}
                            alt={`处理后照片 ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {defect.reviewComment && (
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900">
                  复核意见
                </h3>
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">
                    {defect.reviewComment}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-900">
                基本信息
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between">
                  <dt className="text-gray-500">电站</dt>
                  <dd className="font-medium text-gray-900">
                    {defect.station?.name || "-"}
                  </dd>
                </div>
                <div className="flex items-start justify-between">
                  <dt className="text-gray-500">设备</dt>
                  <dd className="font-medium text-gray-900">
                    {defect.device?.name || "-"}
                  </dd>
                </div>
                <div className="flex items-start justify-between">
                  <dt className="text-gray-500">设备类型</dt>
                  <dd className="font-medium text-gray-900">
                    {defect.device && deviceTypeLabels[defect.device.deviceType]}
                  </dd>
                </div>
                <div className="flex items-start justify-between">
                  <dt className="flex items-center gap-1 text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    方阵/位置
                  </dt>
                  <dd className="font-medium text-gray-900">
                    {defect.array || "-"}
                  </dd>
                </div>
                <div className="flex items-start justify-between">
                  <dt className="flex items-center gap-1 text-gray-500">
                    <Zap className="h-3.5 w-3.5" />
                    影响功率
                  </dt>
                  <dd className="font-medium text-orange-600">
                    {defect.affectedPower
                      ? `${defect.affectedPower} kW`
                      : "-"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-900">
                相关人员
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">巡检员</dt>
                  <dd className="font-medium text-gray-900">
                    {defect.inspector?.name || "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">检修人员</dt>
                  <dd className="font-medium text-gray-900">
                    {defect.assignee?.name || "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">复核人</dt>
                  <dd className="font-medium text-gray-900">
                    {defect.reviewer?.name || "-"}
                  </dd>
                </div>
              </dl>
            </div>

            {defect.partsNeeded && defect.partsNeeded.length > 0 && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Package className="h-4 w-4" />
                  所需备件
                </h3>
                <ul className="space-y-2">
                  {defect.partsWithStatus?.map((part) => (
                    <li
                      key={part.partId}
                      className="flex items-center justify-between rounded-md bg-white p-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {part.partName}
                        </p>
                        <p className="text-xs text-gray-500">
                          需求: {part.quantity} 件
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          sparePartStatusColors[part.status] ||
                            "bg-gray-100 text-gray-600"
                        )}
                      >
                        {sparePartStatusLabels[part.status] || part.status}
                      </span>
                    </li>
                  ))}
                </ul>
                {hasOutOfStockParts && (
                  <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>存在缺货备件，暂不能验收</span>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-900">
                <Clock className="h-4 w-4" />
                时间信息
              </h3>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-gray-500">登记时间</dt>
                  <dd className="text-gray-700">
                    {formatDateTime(defect.registeredAt)}
                  </dd>
                </div>
                {defect.assignedAt && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">分派时间</dt>
                    <dd className="text-gray-700">
                      {formatDateTime(defect.assignedAt)}
                    </dd>
                  </div>
                )}
                {defect.processingStartedAt && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">开始处理</dt>
                    <dd className="text-gray-700">
                      {formatDateTime(defect.processingStartedAt)}
                    </dd>
                  </div>
                )}
                {defect.closedAt && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">关闭时间</dt>
                    <dd className="text-gray-700">
                      {formatDateTime(defect.closedAt)}
                    </dd>
                  </div>
                )}
                {defect.resolutionDuration && (
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <dt className="text-gray-500">消缺时长</dt>
                    <dd className="font-medium text-green-600">
                      {formatDuration(defect.resolutionDuration)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900">处理历史</h3>
        </div>
        <div className="p-6">
          <ol className="relative border-l-2 border-gray-100">
            {defect.histories.map((history, index) => (
              <li key={history.id} className="mb-6 ml-6">
                <span
                  className={cn(
                    "absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white",
                    history.action === "register" && "bg-blue-500",
                    history.action === "assign" && "bg-yellow-500",
                    history.action === "start_processing" && "bg-purple-500",
                    history.action === "submit_result" && "bg-orange-500",
                    history.action === "request_parts" && "bg-gray-500",
                    history.action === "parts_arrived" && "bg-cyan-500",
                    history.action === "accept" && "bg-green-500",
                    history.action === "reject" && "bg-red-500",
                    history.action === "mark_false_positive" && "bg-slate-500"
                  )}
                ></span>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {historyActionLabels[history.action]}
                  </h4>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(history.createdAt)}
                  </span>
                </div>
                {history.userName && (
                  <p className="text-xs text-gray-500">
                    操作人: {history.userName}
                  </p>
                )}
                {history.description && (
                  <p className="mt-1 text-sm text-gray-600">
                    {history.description}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">分派任务</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  选择检修人员
                </label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">请选择检修人员</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedWorker}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认分派
              </button>
            </div>
          </div>
        </div>
      )}

      {showProcessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">提交处理结果</h3>
              <button
                onClick={() => setShowProcessModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  处理结果描述
                </label>
                <textarea
                  value={processResult}
                  onChange={(e) => setProcessResult(e.target.value)}
                  rows={4}
                  placeholder="请输入处理结果..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    所需备件
                  </label>
                </div>
                <div className="space-y-2">
                  {selectedParts.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
                      暂未选择备件
                    </div>
                  ) : (
                    selectedParts.map((part) => (
                      <div
                        key={part.partId}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {part.partName}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <button
                              onClick={() =>
                                updatePartQuantity(
                                  part.partId,
                                  Math.max(1, part.quantity - 1)
                                )
                              }
                              className="h-6 w-6 rounded border border-gray-200 text-gray-600 hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm">
                              {part.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updatePartQuantity(
                                  part.partId,
                                  part.quantity + 1
                                )
                              }
                              className="h-6 w-6 rounded border border-gray-200 text-gray-600 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => removePart(part.partId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-3">
                  <select
                    value=""
                    onChange={(e) => {
                      const part = spareParts.find(
                        (p) => p.id === parseInt(e.target.value)
                      );
                      if (part) addPart(part);
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="">+ 添加备件</option>
                    {spareParts.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.name} ({part.quantity} {part.unit} 可用)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowProcessModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmitResult}
                disabled={!processResult}
                className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提交结果
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">缺陷验收</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {hasOutOfStockParts && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium">存在缺货备件</p>
                  <p className="mt-1 text-xs">
                    备件缺货时不能验收，请先等待备件到货
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  复核意见
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  placeholder="请输入复核意见..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!reviewComment}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ThumbsDown className="h-4 w-4" />
                退回
              </button>
              <button
                onClick={handleAccept}
                disabled={hasOutOfStockParts}
                className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ThumbsUp className="h-4 w-4" />
                验收通过
              </button>
            </div>
          </div>
        </div>
      )}

      {showFalsePositiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">标记为误报</h3>
              <button
                onClick={() => setShowFalsePositiveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  说明
                </label>
                <textarea
                  value={fpComment}
                  onChange={(e) => setFpComment(e.target.value)}
                  rows={3}
                  placeholder="请说明标记为误报的原因..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowFalsePositiveModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleMarkFalsePositive}
                className="rounded-lg bg-slate-500 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
              >
                确认标记
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
