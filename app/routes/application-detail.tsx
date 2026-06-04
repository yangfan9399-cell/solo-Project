import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useStore } from "../utils/store";
import type { Application, SubsidyLevel, DocumentStatus } from "../utils/types";
import {
  getStatusText,
  getSubsidyLevelName,
  getSubsidyAmount,
  getDocumentTypeName,
  getActionTypeText,
  formatDate,
  calculateSubsidy,
  subsidyStandards,
} from "../utils/mockData";

export function meta() {
  return [
    { title: "申请详情 - 工会困难补助系统" },
  ];
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const [application, setApplication] = useState<Application | undefined>(
    store.getApplicationById(id || "")
  );
  const [activeTab, setActiveTab] = useState<"basic" | "documents" | "logs">("basic");
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [newSubsidyLevel, setNewSubsidyLevel] = useState<SubsidyLevel>("LEVEL_3");
  const [adjustReason, setAdjustReason] = useState("");

  useEffect(() => {
    return store.subscribe(() => {
      setApplication(store.getApplicationById(id || ""));
    });
  }, [store, id]);

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">申请不存在</div>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  const isArchived = application.isArchived;
  const calculation = calculateSubsidy(application.familyMembers, application.subsidyLevel);

  const handleUploadDocument = (documentId: string) => {
    if (isArchived) return;
    store.updateDocument(application.id, documentId, {
      status: "PROVIDED" as DocumentStatus,
      uploadDate: new Date().toISOString(),
    });
    store.addApprovalLog(application.id, {
      id: Math.random().toString(36).substring(2, 11),
      userId: "handler-1",
      userName: "张经办",
      actionType: "UPLOAD_DOCUMENT",
      description: "补充材料已上传",
      createdAt: new Date().toISOString(),
    });
  };

  const handleVerifyDocument = (documentId: string) => {
    if (isArchived) return;
    store.updateDocument(application.id, documentId, {
      status: "VERIFIED" as DocumentStatus,
    });
    store.addApprovalLog(application.id, {
      id: Math.random().toString(36).substring(2, 11),
      userId: "handler-1",
      userName: "张经办",
      actionType: "UPLOAD_DOCUMENT",
      description: "材料已核实",
      createdAt: new Date().toISOString(),
    });
  };

  const handleAddNote = () => {
    if (!noteText.trim() || isArchived) return;
    store.addApprovalLog(application.id, {
      id: Math.random().toString(36).substring(2, 11),
      userId: "handler-1",
      userName: "张经办",
      actionType: "ADD_NOTE",
      description: noteText,
      createdAt: new Date().toISOString(),
    });
    setNoteText("");
    setShowNoteModal(false);
  };

  const handleAdjustSubsidy = () => {
    if (!adjustReason.trim() || isArchived) return;
    store.adjustSubsidyLevel(application.id, newSubsidyLevel, adjustReason);
    store.addApprovalLog(application.id, {
      id: Math.random().toString(36).substring(2, 11),
      userId: "handler-1",
      userName: "张经办",
      actionType: "ADJUST_SUBSIDY_LEVEL",
      description: adjustReason,
      oldValue: getSubsidyLevelName(application.subsidyLevel),
      newValue: getSubsidyLevelName(newSubsidyLevel),
      createdAt: new Date().toISOString(),
    });
    setAdjustReason("");
    setShowAdjustModal(false);
  };

  const handleSubmitForReview = () => {
    if (isArchived) return;
    store.submitForReview(application.id);
    store.addApprovalLog(application.id, {
      id: Math.random().toString(36).substring(2, 11),
      userId: "handler-1",
      userName: "张经办",
      actionType: "ADD_NOTE",
      description: "材料已齐全，提交复核",
      createdAt: new Date().toISOString(),
    });
  };

  const handleApprove = () => {
    if (isArchived) return;
    store.approveApplication(application.id);
    store.addApprovalLog(application.id, {
      id: Math.random().toString(36).substring(2, 11),
      userId: "reviewer-1",
      userName: "王复核",
      actionType: "APPROVE",
      description: `同意发放${getSubsidyLevelName(application.subsidyLevel)}补助 ¥${getSubsidyAmount(application.subsidyLevel)}`,
      createdAt: new Date().toISOString(),
    });
  };

  const handleReject = () => {
    if (isArchived) return;
    store.rejectApplication(application.id);
    store.addApprovalLog(application.id, {
      id: Math.random().toString(36).substring(2, 11),
      userId: "reviewer-1",
      userName: "王复核",
      actionType: "REJECT",
      description: "申请不符合条件，予以驳回",
      createdAt: new Date().toISOString(),
    });
  };

  const handleArchive = () => {
    if (isArchived) return;
    store.archiveApplication(
      application.id,
      `补助已发放，金额 ¥${getSubsidyAmount(application.subsidyLevel)}`,
      getSubsidyAmount(application.subsidyLevel)
    );
    store.addApprovalLog(application.id, {
      id: Math.random().toString(36).substring(2, 11),
      userId: "reviewer-1",
      userName: "王复核",
      actionType: "ARCHIVE",
      description: "补助已发放，归档保存",
      createdAt: new Date().toISOString(),
    });
  };

  const handleReopen = () => {
    if (!reopenReason.trim()) return;
    store.reopenApplication(application.id, reopenReason);
    store.addApprovalLog(application.id, {
      id: Math.random().toString(36).substring(2, 11),
      userId: "handler-1",
      userName: "张经办",
      actionType: "REOPEN",
      description: reopenReason,
      createdAt: new Date().toISOString(),
    });
    setReopenReason("");
    setShowReopenModal(false);
  };

  const getDocumentStatusBadge = (status: string) => {
    const base = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case "MISSING":
        return `${base} bg-red-100 text-red-800`;
      case "PROVIDED":
        return `${base} bg-yellow-100 text-yellow-800`;
      case "VERIFIED":
        return `${base} bg-green-100 text-green-800`;
      default:
        return `${base} bg-gray-100 text-gray-800`;
    }
  };

  const getDocumentStatusText = (status: string) => {
    const map: Record<string, string> = {
      MISSING: "缺失",
      PROVIDED: "已提供",
      VERIFIED: "已核实",
    };
    return map[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-gray-500 hover:text-gray-700"
              >
                ← 返回列表
              </Link>
              <h1 className="text-xl font-bold text-gray-900">
                困难补助申请详情
              </h1>
              {isArchived && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-200 text-gray-700">
                  已归档
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isArchived ? (
                <button
                  onClick={() => setShowReopenModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  重新开启
                </button>
              ) : (
                <>
                  {application.status === "PENDING_HANDLER" && (
                    <>
                      <button
                        onClick={() => setShowNoteModal(true)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        添加备注
                      </button>
                      <button
                        onClick={() => {
                          setNewSubsidyLevel(application.subsidyLevel);
                          setShowAdjustModal(true);
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        调整档位
                      </button>
                      <button
                        onClick={handleSubmitForReview}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        提交复核
                      </button>
                    </>
                  )}
                  {application.status === "PENDING_REVIEW" && (
                    <>
                      <button
                        onClick={handleReject}
                        className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                      >
                        退回
                      </button>
                      <button
                        onClick={handleApprove}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        确认发放
                      </button>
                    </>
                  )}
                  {application.status === "APPROVED" && (
                    <button
                      onClick={handleArchive}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      归档
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab("basic")}
                    className={`px-6 py-4 text-sm font-medium border-b-2 ${
                      activeTab === "basic"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    基本信息
                  </button>
                  <button
                    onClick={() => setActiveTab("documents")}
                    className={`px-6 py-4 text-sm font-medium border-b-2 ${
                      activeTab === "documents"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    申请材料 ({application.documents.filter(d => d.status !== "MISSING").length}/{application.documents.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("logs")}
                    className={`px-6 py-4 text-sm font-medium border-b-2 ${
                      activeTab === "logs"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    审批记录 ({application.approvalLogs.length})
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === "basic" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        申请来源
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">申请人</div>
                          <div className="font-medium">{application.applicantName}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">身份证号</div>
                          <div className="font-medium">{application.applicantIdCard}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">联系电话</div>
                          <div className="font-medium">{application.phone}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">申请来源</div>
                          <div className="font-medium">{application.source}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-sm text-gray-500">家庭住址</div>
                          <div className="font-medium">{application.address}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        家庭情况摘要
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">姓名</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">关系</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">年龄</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">职业</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">月收入</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">健康状况</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {application.familyMembers.map((member) => (
                              <tr key={member.id}>
                                <td className="px-3 py-2 text-sm">{member.name}</td>
                                <td className="px-3 py-2 text-sm">{member.relation}</td>
                                <td className="px-3 py-2 text-sm">{member.age}</td>
                                <td className="px-3 py-2 text-sm">{member.occupation}</td>
                                <td className="px-3 py-2 text-sm">¥{member.monthlyIncome}</td>
                                <td className="px-3 py-2 text-sm">{member.healthStatus}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 flex gap-4 text-sm text-gray-600">
                        <span>家庭总人口: {calculation.familySize}人</span>
                        <span>月总收入: ¥{calculation.totalIncome}</span>
                        <span>人均月收入: ¥{calculation.averageIncome.toFixed(2)}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        补助档位与发放依据
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-lg font-bold text-blue-600">
                              {getSubsidyLevelName(application.subsidyLevel)}
                            </span>
                            <span className="ml-2 text-2xl font-bold text-gray-900">
                              ¥{getSubsidyAmount(application.subsidyLevel)}
                            </span>
                          </div>
                          {application.exceedsStandard && (
                            <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-800">
                              标准超限
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {subsidyStandards.find(s => s.level === application.subsidyLevel)?.description}
                        </div>
                      </div>
                    </div>

                    {application.exceedsStandard && (
                      <div className="border border-orange-200 rounded-lg bg-orange-50 p-4">
                        <h4 className="font-medium text-orange-900 mb-3">
                          ⚠️ 补助标准超限 - 计算差异与审批路径
                        </h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-white rounded p-3">
                            <div className="text-sm text-gray-500">按收入计算档位</div>
                            <div className="font-medium text-gray-900">
                              {getSubsidyLevelName(calculation.calculatedLevel)}
                            </div>
                            <div className="text-sm text-gray-500">
                              ¥{getSubsidyAmount(calculation.calculatedLevel)}
                            </div>
                          </div>
                          <div className="bg-white rounded p-3 border-2 border-orange-300">
                            <div className="text-sm text-gray-500">申请档位</div>
                            <div className="font-medium text-orange-700">
                              {getSubsidyLevelName(application.subsidyLevel)}
                            </div>
                            <div className="text-sm text-gray-500">
                              ¥{getSubsidyAmount(application.subsidyLevel)}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 mb-3">
                          档位差异: 越级 {calculation.difference} 档，
                          金额差异: +¥{getSubsidyAmount(application.subsidyLevel) - getSubsidyAmount(calculation.calculatedLevel)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">升级审批路径:</div>
                          <div className="flex items-center gap-2">
                            {calculation.approvalPath.map((step, index) => (
                              <div key={index} className="flex items-center">
                                <span className="px-3 py-1 bg-white rounded-full text-sm border border-orange-300">
                                  {step}
                                </span>
                                {index < calculation.approvalPath.length - 1 && (
                                  <span className="mx-2 text-orange-500">→</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        {application.approvalPath && (
                          <div className="mt-3 text-sm text-gray-600">
                            当前进度: {application.approvalPath}
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        当前责任人
                      </h3>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {application.currentHandler?.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{application.currentHandler?.name}</div>
                            <div className="text-sm text-gray-500">经办人</div>
                          </div>
                        </div>
                        {application.currentReviewer && (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-green-600 font-medium">
                                {application.currentReviewer.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{application.currentReviewer.name}</div>
                              <div className="text-sm text-gray-500">复核人</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {application.reopenRecords.length > 0 && (
                      <div className="border border-blue-200 rounded-lg bg-blue-50 p-4">
                        <h4 className="font-medium text-blue-900 mb-3">
                          📋 重新开启记录
                        </h4>
                        {application.reopenRecords.map((record) => (
                          <div key={record.id} className="bg-white rounded p-3 mb-2 last:mb-0">
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-sm">
                                <span className="font-medium">{record.reopenedBy}</span>
                                <span className="text-gray-500 mx-2">于</span>
                                <span>{formatDate(record.reopenedAt)}</span>
                                <span className="text-gray-500 mx-2">重新开启</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">开启原因:</span> {record.reopenReason}
                            </div>
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">原发放结论:</span> {record.originalConclusion}
                              <span className="mx-2">|</span>
                              <span className="font-medium">原金额:</span> ¥{record.originalAmount}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "documents" && (
                  <div className="space-y-4">
                    {application.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600">📄</span>
                          </div>
                          <div>
                            <div className="font-medium">{doc.name}</div>
                            <div className="text-sm text-gray-500">
                              {getDocumentTypeName(doc.type)}
                              {doc.uploadDate && ` · 上传于 ${formatDate(doc.uploadDate)}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={getDocumentStatusBadge(doc.status)}>
                            {getDocumentStatusText(doc.status)}
                          </span>
                          {!isArchived && doc.status === "MISSING" && (
                            <button
                              onClick={() => handleUploadDocument(doc.id)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              补充材料
                            </button>
                          )}
                          {!isArchived && doc.status === "PROVIDED" && (
                            <button
                              onClick={() => handleVerifyDocument(doc.id)}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              核实
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "logs" && (
                  <div className="space-y-4">
                    {application.approvalLogs
                      .slice()
                      .reverse()
                      .map((log) => (
                        <div key={log.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 text-sm font-medium">
                                {log.userName.charAt(0)}
                              </span>
                            </div>
                            <div className="w-0.5 flex-1 bg-gray-200"></div>
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{log.userName}</span>
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                {getActionTypeText(log.actionType)}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDate(log.createdAt)}
                              </span>
                            </div>
                            <div className="text-gray-700">{log.description}</div>
                            {(log.oldValue || log.newValue) && (
                              <div className="mt-2 text-sm">
                                {log.oldValue && (
                                  <span className="text-red-600">
                                    变更前: {log.oldValue}
                                  </span>
                                )}
                                {log.oldValue && log.newValue && (
                                  <span className="mx-2 text-gray-400">→</span>
                                )}
                                {log.newValue && (
                                  <span className="text-green-600">
                                    变更后: {log.newValue}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4">申请状态</h3>
              <div className="text-center mb-4">
                <span className={`inline-block px-4 py-2 text-sm font-medium rounded-full ${
                  application.status === "PENDING_HANDLER"
                    ? "bg-yellow-100 text-yellow-800"
                    : application.status === "PENDING_REVIEW"
                    ? "bg-blue-100 text-blue-800"
                    : application.status === "APPROVED"
                    ? "bg-green-100 text-green-800"
                    : application.status === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {getStatusText(application.status)}
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">申请时间</span>
                  <span>{formatDate(application.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">更新时间</span>
                  <span>{formatDate(application.updatedAt)}</span>
                </div>
                {application.archivedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">归档时间</span>
                    <span>{formatDate(application.archivedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4">补助标准参考</h3>
              <div className="space-y-3">
                {subsidyStandards.map((std) => (
                  <div
                    key={std.id}
                    className={`p-3 rounded-lg border ${
                      application.subsidyLevel === std.level
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${
                        application.subsidyLevel === std.level ? "text-blue-700" : "text-gray-700"
                      }`}>
                        {std.name}
                      </span>
                      <span className="font-bold text-gray-900">¥{std.amount}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      人均收入 ¥{std.minIncome} - ¥{std.maxIncome === 99999 ? "+" : std.maxIncome}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showReopenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">重新开启申请</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                开启原因
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入重新开启的原因..."
              />
            </div>
            {application.archiveRecords.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <div className="text-sm font-medium text-gray-700 mb-1">原发放结论</div>
                <div className="text-sm text-gray-600">
                  {application.archiveRecords[application.archiveRecords.length - 1].conclusion}
                </div>
                <div className="text-sm text-gray-600">
                  原金额: ¥{application.archiveRecords[application.archiveRecords.length - 1].finalAmount}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReopenModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleReopen}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                确认开启
              </button>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">添加备注</h3>
            <div className="mb-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入备注内容..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAddNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">调整补助档位</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择档位
              </label>
              <select
                value={newSubsidyLevel}
                onChange={(e) => setNewSubsidyLevel(e.target.value as SubsidyLevel)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {subsidyStandards.map((std) => (
                  <option key={std.id} value={std.level}>
                    {std.name} - ¥{std.amount}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                调整原因
              </label>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入调整原因..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAdjustSubsidy}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                确认调整
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
