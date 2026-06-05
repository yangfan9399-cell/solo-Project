"use client";

import { useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ConflictBadge from "@/components/ConflictBadge";
import { mockExpiryReports, getBatchById, getStoreById, mockUsers } from "@/lib/mockData";
import { formatDate, formatDateTime, getDisposalTypeText, getDaysUntilExpiry } from "@/lib/utils";

export default function ReportsPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterConflict, setFilterConflict] = useState<string>("all");

  const reports = mockExpiryReports
    .filter((r) => filterStatus === "all" || r.status === filterStatus)
    .filter((r) => filterConflict === "all" || r.conflictType === filterConflict)
    .map((report) => ({
      ...report,
      batch: getBatchById(report.batchId),
      store: getStoreById(report.storeId),
      reportedByUser: mockUsers.find((u) => u.id === report.reportedBy),
    }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">上报列表</h1>
          <p className="mt-1 text-gray-600">查看和管理近效期药品上报记录</p>
        </div>
        <Link
          href="/reports/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          ➕ 新建上报
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">状态筛选:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全部</option>
              <option value="pending">待处理</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
              <option value="blocked">已阻断</option>
              <option value="archived">已归档</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">冲突类型:</label>
            <select
              value={filterConflict}
              onChange={(e) => setFilterConflict(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全部</option>
              <option value="none">无冲突</option>
              <option value="batch_mismatch">批号不一致</option>
              <option value="quantity_exceeded">销毁数量超限</option>
              <option value="store_conflict">责任门店冲突</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">上报编号</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">药品信息</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">上报门店</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">数量</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">效期</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">处置方式</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">状态</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">上报时间</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((report) => {
                const daysUntilExpiry = report.batch?.expiryDate ? getDaysUntilExpiry(report.batch.expiryDate) : 0;
                return (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <Link href={`/reports/${report.id}`} className="text-blue-600 hover:text-blue-700 font-medium">
                        {report.reportNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{report.batch?.medicine?.name}</div>
                      <div className="text-sm text-gray-500">批号: {report.batch?.batchNumber}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-700">{report.store?.name}</div>
                      <div className="text-sm text-gray-500">{report.store?.code}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-700">{report.reportedQuantity} {report.batch?.medicine?.unit}</div>
                      {report.reportedQuantity !== report.inventoryQuantity && (
                        <div className="text-xs text-red-600">
                          系统库存: {report.inventoryQuantity}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className={daysUntilExpiry <= 30 ? "text-red-600 font-medium" : "text-gray-700"}>
                        {formatDate(report.batch?.expiryDate || null)}
                        <div className="text-xs">还有 {daysUntilExpiry} 天</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.disposalType === "transfer" ? "bg-green-100 text-green-800" :
                        report.disposalType === "destruction" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {getDisposalTypeText(report.disposalType)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={report.status} />
                        {report.conflictType !== "none" && <ConflictBadge conflictType={report.conflictType} />}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {formatDateTime(report.createdAt)}
                    </td>
                    <td className="py-4 px-6">
                      <Link
                        href={`/reports/${report.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        查看详情
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {reports.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <div className="text-4xl mb-4">📭</div>
            <p>暂无符合条件的上报记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
