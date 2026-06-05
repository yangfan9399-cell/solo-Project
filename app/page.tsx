import Link from "next/link";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import ConflictBadge from "@/components/ConflictBadge";
import {
  getSummaryStats,
  getAllReports,
  type Store,
} from "@/lib/actions";
import {
  formatDate,
  formatDateTime,
  getDisposalTypeText,
  getDaysUntilExpiry,
} from "@/lib/utils";

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
  reportedByUser?: {
    id: number;
    name: string;
  };
}

interface SummaryStats {
  totalReports: number;
  pendingReports: number;
  blockedReports: number;
  totalLoss: number;
}

export default async function Home() {
  const stats = (await getSummaryStats()) as SummaryStats;
  const allReports = (await getAllReports()) as ReportItem[];
  const recentReports = allReports.slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">连锁药房近效期药品管理平台</h1>
        <p className="mt-2 text-gray-600">门店上报 → 调拨建议 → 销毁申请 → 复核归档</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="总上报数"
          value={stats.totalReports}
          icon="📋"
          color="bg-blue-100"
          subtitle="近效期药品"
        />
        <StatCard
          title="待处理"
          value={stats.pendingReports}
          icon="⏳"
          color="bg-yellow-100"
          subtitle="需要审核"
        />
        <StatCard
          title="已阻断"
          value={stats.blockedReports}
          icon="🚫"
          color="bg-red-100"
          subtitle="存在冲突"
        />
        <StatCard
          title="总损耗金额"
          value={`¥${stats.totalLoss.toFixed(2)}`}
          icon="💰"
          color="bg-gray-100"
          subtitle="销毁药品"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/reports" className="block">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-bold mb-2">门店上报</h3>
            <p className="text-blue-100 text-sm">门店经办人上报近效期药品批次和库存说明</p>
          </div>
        </Link>
        <Link href="/pharmacist" className="block">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl">
            <div className="text-4xl mb-4">🔬</div>
            <h3 className="text-xl font-bold mb-2">药师审核</h3>
            <p className="text-green-100 text-sm">区域药师确认调拨或销毁方案</p>
          </div>
        </Link>
        <Link href="/finance" className="block">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
            <div className="text-4xl mb-4">💵</div>
            <h3 className="text-xl font-bold mb-2">财务复核</h3>
            <p className="text-purple-100 text-sm">财务人员复核损耗结果并归档</p>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">最近上报记录</h2>
          <Link
            href="/reports"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            查看全部 →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  上报编号
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  药品信息
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  门店
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  数量
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  效期
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  处置方式
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  状态
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  上报时间
                </th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((item) => {
                const { report, batch, store } = item;
                const daysUntilExpiry = batch?.expiryDate
                  ? getDaysUntilExpiry(batch.expiryDate)
                  : 0;
                return (
                  <tr
                    key={report.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <Link
                        href={`/reports/${report.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {report.reportNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">
                        {batch?.medicine?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        批号: {batch?.batchNumber}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-700">{store?.name}</td>
                    <td className="py-4 px-4 text-gray-700">
                      {report.reportedQuantity} {batch?.medicine?.unit}
                    </td>
                    <td className="py-4 px-4">
                      <div
                        className={
                          daysUntilExpiry <= 30
                            ? "text-red-600 font-medium"
                            : "text-gray-700"
                        }
                      >
                        {formatDate(batch?.expiryDate || null)}
                        <div className="text-xs">还有 {daysUntilExpiry} 天</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.disposalType === "transfer"
                            ? "bg-green-100 text-green-800"
                            : report.disposalType === "destruction"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getDisposalTypeText(report.disposalType)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={report.status} />
                        {report.conflictType !== "none" && (
                          <ConflictBadge conflictType={report.conflictType} />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {formatDateTime(report.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📌 预置数据说明</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-lg">✅</span>
              <div>
                <div className="font-medium text-green-800">5家连锁门店</div>
                <div className="text-green-700">
                  朝阳总店、海淀分店、西城分店、东城分店、丰台分店
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-lg">💊</span>
              <div>
                <div className="font-medium text-blue-800">5种常用药品</div>
                <div className="text-blue-700">
                  阿莫西林胶囊、硝苯地平缓释片、奥美拉唑肠溶胶囊、布洛芬缓释胶囊、维生素C片
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <span className="text-lg">📦</span>
              <div>
                <div className="font-medium text-orange-800">7个药品批次</div>
                <div className="text-orange-700">包含不同效期和库存的批次记录</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <span className="text-lg">📋</span>
              <div>
                <div className="font-medium text-purple-800">4条上报记录</div>
                <div className="text-purple-700">包含正常、批号不一致、销毁超限等各种状态</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🔄 业务流程</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                1
              </div>
              <div>
                <div className="font-medium text-gray-900">门店经办人</div>
                <div className="text-sm text-gray-500">上报近效期药品批次和库存</div>
              </div>
            </div>
            <div className="w-0.5 h-6 bg-gray-200 ml-4"></div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">
                2
              </div>
              <div>
                <div className="font-medium text-gray-900">区域药师</div>
                <div className="text-sm text-gray-500">确认调拨或销毁方案</div>
              </div>
            </div>
            <div className="w-0.5 h-6 bg-gray-200 ml-4"></div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                3
              </div>
              <div>
                <div className="font-medium text-gray-900">财务复核</div>
                <div className="text-sm text-gray-500">复核损耗金额并归档</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
