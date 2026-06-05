"use client";

import { useState } from "react";
import {
  getSummaryStats,
  getStoreSummaries,
  getCategorySummaries,
  getDisposalSummaries,
  mockExpiryReports,
  getBatchById,
  getStoreById,
} from "@/lib/mockData";
import { getCategoryText, getDisposalTypeText, formatCurrency } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import ConflictBadge from "@/components/ConflictBadge";

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<"stores" | "categories" | "disposal">("stores");

  const summaryStats = getSummaryStats();
  const storeSummaries = getStoreSummaries().filter((s) => s.reportCount > 0);
  const categorySummaries = getCategorySummaries();
  const disposalSummaries = getDisposalSummaries();

  const maxReportCount = Math.max(...storeSummaries.map((s) => s.reportCount), 1);
  const maxLossAmount = Math.max(...storeSummaries.map((s) => s.lossAmount), 1);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">复盘统计</h1>
        <p className="mt-1 text-gray-600">按门店、药品类别、处置方式和损耗金额聚合分析</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总上报数</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{summaryStats.totalReports}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待处理</p>
              <p className="mt-1 text-3xl font-bold text-yellow-600">{summaryStats.pendingReports}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已阻断</p>
              <p className="mt-1 text-3xl font-bold text-red-600">{summaryStats.blockedReports}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <span className="text-2xl">🚫</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总损耗金额</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {formatCurrency(summaryStats.totalLossAmount)}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("stores")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "stores"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            🏪 按门店统计
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "categories"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            💊 按药品类别统计
          </button>
          <button
            onClick={() => setActiveTab("disposal")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "disposal"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            🔄 按处置方式统计
          </button>
        </div>
      </div>

      {activeTab === "stores" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">门店统计</h2>
            <p className="text-sm text-gray-500">各门店的近效期药品上报和处置情况</p>
          </div>
          <div className="divide-y divide-gray-100">
            {storeSummaries.map((store) => (
              <div key={store.storeId} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{store.storeName}</h3>
                    <p className="text-sm text-gray-500">{store.storeCode}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{store.reportCount}</div>
                      <div className="text-xs text-gray-500">上报数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{store.transferQuantity}</div>
                      <div className="text-xs text-gray-500">调拨数量</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{store.destructionQuantity}</div>
                      <div className="text-xs text-gray-500">销毁数量</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(store.lossAmount)}
                      </div>
                      <div className="text-xs text-gray-500">损耗金额</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 w-24">上报占比</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${(store.reportCount / maxReportCount) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">
                      {((store.reportCount / maxReportCount) * 100).toFixed(0)}%
                    </span>
                  </div>
                  {maxLossAmount > 0 && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 w-24">损耗占比</span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${(store.lossAmount / maxLossAmount) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-16 text-right">
                        {((store.lossAmount / maxLossAmount) * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">药品类别统计</h2>
            <p className="text-sm text-gray-500">各类别药品的近效期上报和处置情况</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">药品类别</th>
                  <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">上报数</th>
                  <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">调拨数量</th>
                  <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">销毁数量</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">损耗金额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categorySummaries.map((category) => (
                  <tr key={category.category} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">
                        {getCategoryText(category.category)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-medium text-blue-600">{category.reportCount}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-medium text-green-600">{category.transferQuantity}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-medium text-red-600">{category.destructionQuantity}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-medium text-orange-600">
                        {formatCurrency(category.lossAmount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "disposal" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {disposalSummaries.map((summary) => (
            <div
              key={summary.disposalType}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                summary.disposalType === "transfer"
                  ? "border-green-200"
                  : "border-red-200"
              }`}
            >
              <div
                className={`p-6 ${
                  summary.disposalType === "transfer"
                    ? "bg-green-50 border-b border-green-200"
                    : "bg-red-50 border-b border-red-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {summary.disposalType === "transfer" ? "📤" : "🗑️"}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {getDisposalTypeText(summary.disposalType)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {summary.disposalType === "transfer"
                        ? "门店间调拨的近效期药品"
                        : "已销毁的过期或无法使用药品"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{summary.reportCount}</div>
                    <div className="text-sm text-gray-500">涉及上报数</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{summary.quantity}</div>
                    <div className="text-sm text-gray-500">总数量</div>
                  </div>
                  {summary.lossAmount > 0 && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(summary.lossAmount)}
                      </div>
                      <div className="text-sm text-gray-500">损耗金额</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">异常情况汇总</h2>
          <p className="text-sm text-gray-500">存在冲突或异常的上报记录</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">上报编号</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">药品</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">门店</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">异常类型</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">状态</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">异常说明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockExpiryReports
                .filter((r) => r.conflictType !== "none")
                .map((report) => {
                  const batch = getBatchById(report.batchId);
                  const store = getStoreById(report.storeId);
                  return (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <span className="font-medium text-blue-600">{report.reportNumber}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{batch?.medicine?.name}</div>
                        <div className="text-sm text-gray-500">批号: {batch?.batchNumber}</div>
                      </td>
                      <td className="py-4 px-6 text-gray-700">{store?.name}</td>
                      <td className="py-4 px-6">
                        <ConflictBadge conflictType={report.conflictType} />
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {report.conflictNotes}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
