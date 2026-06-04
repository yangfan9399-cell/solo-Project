import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useStore } from "../utils/store";
import type { Application, ApplicationStatus } from "../utils/types";
import { getStatusText, getSubsidyLevelName, getSubsidyAmount, formatDate } from "../utils/mockData";

export function meta() {
  return [
    { title: "困难补助申请列表 - 工会困难补助系统" },
  ];
}

export default function Applications() {
  const store = useStore();
  const [applications, setApplications] = useState<Application[]>(store.getApplications());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    return store.subscribe(() => {
      setApplications([...store.getApplications()]);
    });
  }, [store]);

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSearch =
      app.applicantName.includes(searchTerm) ||
      app.applicantIdCard.includes(searchTerm) ||
      app.source.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusBadgeClass = (status: ApplicationStatus) => {
    const base = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case "PENDING_HANDLER":
        return `${base} bg-yellow-100 text-yellow-800`;
      case "PENDING_REVIEW":
        return `${base} bg-blue-100 text-blue-800`;
      case "APPROVED":
        return `${base} bg-green-100 text-green-800`;
      case "REJECTED":
        return `${base} bg-red-100 text-red-800`;
      case "ARCHIVED":
        return `${base} bg-gray-100 text-gray-800`;
      default:
        return `${base} bg-gray-100 text-gray-800`;
    }
  };

  const getAlertBadge = (app: Application) => {
    const missingDocs = app.documents.filter((d) => d.status === "MISSING");
    const isDuplicate = app.approvalLogs.some(
      (log) => log.description.includes("重复申请")
    );

    if (app.exceedsStandard) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
          标准超限
        </span>
      );
    }
    if (missingDocs.length > 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          缺{missingDocs.length}份材料
        </span>
      );
    }
    if (isDuplicate) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
          疑似重复
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            工会困难补助申请与发放复核系统
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            共 {applications.length} 条申请记录
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
            <div className="text-sm text-gray-500">全部申请</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts["PENDING_HANDLER"] || 0}
            </div>
            <div className="text-sm text-gray-500">待经办人处理</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts["PENDING_REVIEW"] || 0}
            </div>
            <div className="text-sm text-gray-500">待复核</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {statusCounts["APPROVED"] || 0}
            </div>
            <div className="text-sm text-gray-500">已批准</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-600">
              {statusCounts["ARCHIVED"] || 0}
            </div>
            <div className="text-sm text-gray-500">已归档</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    statusFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setStatusFilter("PENDING_HANDLER")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    statusFilter === "PENDING_HANDLER"
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  待经办
                </button>
                <button
                  onClick={() => setStatusFilter("PENDING_REVIEW")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    statusFilter === "PENDING_REVIEW"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  待复核
                </button>
                <button
                  onClick={() => setStatusFilter("ARCHIVED")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    statusFilter === "ARCHIVED"
                      ? "bg-gray-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  已归档
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索申请人姓名、身份证号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申请人
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申请来源
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    补助档位
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    补助金额
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    当前状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    当前责任人
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申请时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {app.applicantName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.applicantIdCard}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {app.source}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">
                          {getSubsidyLevelName(app.subsidyLevel)}
                        </span>
                        {getAlertBadge(app)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      ¥{getSubsidyAmount(app.subsidyLevel)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={getStatusBadgeClass(app.status)}>
                        {getStatusText(app.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {app.status === "PENDING_HANDLER"
                        ? app.currentHandler?.name
                        : app.status === "PENDING_REVIEW"
                        ? app.currentReviewer?.name
                        : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/applications/${app.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {app.isArchived ? "查看归档" : "查看详情"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredApplications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">没有找到匹配的申请记录</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
