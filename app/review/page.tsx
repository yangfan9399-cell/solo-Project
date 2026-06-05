"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getSummaryStats,
  getStoreSummaries,
  getCategorySummaries,
  getDisposalSummaries,
  getAllReports,
  type Store,
} from "@/lib/actions";
import {
  getCategoryText,
  getDisposalTypeText,
  formatCurrency,
  formatDate,
} from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import ConflictBadge from "@/components/ConflictBadge";

interface SummaryStats {
  totalReports: number;
  pendingReports: number;
  blockedReports: number;
  totalLoss: number;
}

interface StoreSummary {
  store: Store;
  reportCount: number;
  transferQuantity: number;
  destructionQuantity: number;
  lossAmount: number;
}

interface CategorySummary {
  category: string;
  reportCount: number;
  transferQuantity: number;
  destructionQuantity: number;
  lossAmount: number;
}

interface DisposalSummary {
  transfer: {
    count: number;
    totalQuantity: number;
  };
  destruction: {
    count: number;
    totalQuantity: number;
    totalLoss: number;
  };
}

interface Batch {
  id: number;
  medicineId: number;
  batchNumber: string;
  productionDate: string;
  expiryDate: string;
  medicine?: {
    id: number;
    name: string;
    genericName: string;
    specification: string;
    manufacturer: string;
    category: string;
    unit: string;
    price: string;
  };
}

interface ReportItem {
  report: {
    id: number;
    reportNumber: string;
    storeId: number;
    reportedBy: number;
    batchId: number;
    reportedQuantity: number;
    inventoryQuantity: number;
    notes?: string;
    conflictType: string;
    conflictNotes?: string;
    status: string;
    disposalType: string;
    suggestedTransferStoreId?: number;
    createdAt: string;
    updatedAt: string;
  };
  store?: Store;
  batch?: Batch;
}

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<"stores" | "categories" | "disposal">("stores");
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [storeSummaries, setStoreSummaries] = useState<StoreSummary[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [disposalSummaries, setDisposalSummaries] = useState<DisposalSummary | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [stats, stores, categories, disposal, reportsData] = await Promise.all([
      getSummaryStats(),
      getStoreSummaries(),
      getCategorySummaries(),
      getDisposalSummaries(),
      getAllReports(),
    ]);
    setSummaryStats(stats);
    setStoreSummaries(stores.filter((s) => s.reportCount > 0));
    setCategorySummaries(categories);
    setDisposalSummaries(disposal);
    setReports(reportsData as ReportItem[]);
  }

  const maxReportCount = Math.max(...storeSummaries.map((s) => s.reportCount), 1);
  const maxLossAmount = Math.max(...storeSummaries.map((s) => s.lossAmount), 1);
  const conflictReports = reports.filter((r) => r.report.conflictType !== "none");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">复盘统计</h1>
        <p className="mt-1 text-gray-600">
          按门店、药品类别、处置方式和损耗金额聚合分析
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总上报数</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {summaryStats?.totalReports || 0}
              </p>
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
              <p className="mt-1 text-3xl font-bold text-yellow-600">
                {summaryStats?.pendingReports || 0}
              </p>
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
              <p className="mt-1 text-3xl font-bold text-red-600">
                {summaryStats?.blockedReports || 0}
              </p>
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
                {formatCurrency(summaryStats?.totalLoss || 0)}
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
            {storeSummaries.map((summary) => (
              <div key={summary.store.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {summary.store.name}
                    </h3>
                    <p className="text-sm text-gray-500">{summary.store.code}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {summary.reportCount}
                      </div>
                      <div className="text-xs text-gray-500">上报数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {summary.transferQuantity}
                      </div>
                      <div className="text-xs text-gray-500">调拨数量</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {summary.destructionQuantity}
                      </div>
                      <div className="text-xs text-gray-500">销毁数量</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(summary.lossAmount)}
                      </div>
                      <div className="text-xs text-gray-500">损耗金额</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500 w-20">上报占比</div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${(summary.reportCount / maxReportCount) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 w-12 text-right">
                      {Math.round((summary.reportCount / maxReportCount) * 100)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500 w-20">损耗占比</div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{
                          width: `${(summary.lossAmount / maxLossAmount) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 w-12 text-right">
                      {Math.round((summary.lossAmount / maxLossAmount) * 100)}%
                    </div>
                  </div>
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
            <p className="text-sm text-gray-500">按药品类别的近效期药品统计</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">
                    药品类别
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">
                    上报数
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">
                    调拨数量
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">
                    销毁数量
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">
                    损耗金额
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categorySummaries.map((category) => (
                  <tr key={category.category} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <span className="font-medium text-gray-900">
                        {getCategoryText(category.category)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-blue-600 font-medium">
                        {category.reportCount}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-green-600 font-medium">
                        {category.transferQuantity}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-red-600 font-medium">
                        {category.destructionQuantity}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-orange-600 font-medium">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-2xl">📤</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">调拨统计</h3>
                <p className="text-sm text-gray-500">跨门店调拨的药品数量</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="text-gray-600">调拨申请数</div>
                <div className="text-2xl font-bold text-green-600">
                  {disposalSummaries?.transfer.count || 0}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="text-gray-600">调拨总数量</div>
                <div className="text-2xl font-bold text-green-600">
                  {disposalSummaries?.transfer.totalQuantity || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 rounded-full">
                <span className="text-2xl">🗑️</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">销毁统计</h3>
                <p className="text-sm text-gray-500">销毁的药品数量和损耗金额</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="text-gray-600">销毁申请数</div>
                <div className="text-2xl font-bold text-red-600">
                  {disposalSummaries?.destruction.count || 0}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="text-gray-600">销毁总数量</div>
                <div className="text-2xl font-bold text-red-600">
                  {disposalSummaries?.destruction.totalQuantity || 0}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="text-gray-600">总损耗金额</div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(disposalSummaries?.destruction.totalLoss || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">⚠️ 异常情况汇总</h2>
          <p className="text-sm text-gray-500">存在冲突或异常的上报记录</p>
        </div>
        <div className="divide-y divide-gray-100">
          {conflictReports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">🎉</div>
              <p>暂无异常情况</p>
            </div>
          ) : (
            conflictReports.map((item) => {
              const { report, store, batch } = item;
              return (
                <div key={report.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/reports/${report.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {report.reportNumber}
                        </Link>
                        <span className="text-sm text-gray-500">
                          {batch?.medicine?.name} - {store?.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ConflictBadge conflictType={report.conflictType} />
                      <StatusBadge status={report.status} />
                    </div>
                  </div>
                  {report.conflictNotes && (
                    <div className="mt-2 text-sm text-gray-600">
                      {report.conflictNotes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
