import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { db } from "~/db/index.server";
import { and, eq, gte, sql } from "drizzle-orm";
import { serviceRecords, elders, staff, reviewNodes } from "~/db/schema.server";
import type { InferSelectModel } from "drizzle-orm";

type ServiceRecordWithRelations = InferSelectModel<typeof serviceRecords> & {
  elder: InferSelectModel<typeof elders>;
  staff: InferSelectModel<typeof staff>;
  latestReviewNode: InferSelectModel<typeof reviewNodes> | null;
};

type LoaderData = {
  todayScheduled: ServiceRecordWithRelations[];
  pendingReview: ServiceRecordWithRelations[];
  abnormalStuck: ServiceRecordWithRelations[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);

  const getServiceRecordsWithRelations = async (
    whereClause: any
  ): Promise<ServiceRecordWithRelations[]> => {
    const records = await db
      .select({
        serviceRecord: serviceRecords,
        elder: elders,
        staff: staff,
      })
      .from(serviceRecords)
      .leftJoin(elders, eq(serviceRecords.elderId, elders.id))
      .leftJoin(staff, eq(serviceRecords.staffId, staff.id))
      .where(whereClause);

    const result: ServiceRecordWithRelations[] = [];
    for (const r of records) {
      const reviewNodesList = await db
        .select()
        .from(reviewNodes)
        .where(eq(reviewNodes.serviceRecordId, r.serviceRecord.id))
        .orderBy(reviewNodes.nodeOrder);

      result.push({
        ...r.serviceRecord,
        elder: r.elder!,
        staff: r.staff!,
        latestReviewNode: reviewNodesList[reviewNodesList.length - 1] || null,
      });
    }
    return result;
  };

  const todayScheduled = await getServiceRecordsWithRelations(
    and(
      eq(serviceRecords.status, "scheduled"),
      gte(serviceRecords.scheduledTime, todayStart),
      lt(serviceRecords.scheduledTime, todayEnd)
    )
  );

  const pendingReview = await getServiceRecordsWithRelations(
    sql`EXISTS (
      SELECT 1 FROM review_nodes rn
      WHERE rn.service_record_id = ${serviceRecords.id}
      AND rn.review_status = 'pending'
      AND rn.is_archived = false
    )`
  );

  const abnormalStuck = await getServiceRecordsWithRelations(
    and(
      sql`${serviceRecords.status} IN ('no_answer', 'time_conflict', 'complaint')`,
      gte(serviceRecords.updatedAt, threeDaysAgo)
    )
  );

  return json<LoaderData>({
    todayScheduled,
    pendingReview,
    abnormalStuck,
  });
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    scheduled: { label: "待上门", className: "bg-blue-100 text-blue-800" },
    in_progress: { label: "进行中", className: "bg-yellow-100 text-yellow-800" },
    completed: { label: "已完成", className: "bg-green-100 text-green-800" },
    no_answer: { label: "未接听", className: "bg-orange-100 text-orange-800" },
    time_conflict: { label: "时长冲突", className: "bg-purple-100 text-purple-800" },
    complaint: { label: "家属投诉", className: "bg-red-100 text-red-800" },
    archived: { label: "已归档", className: "bg-gray-100 text-gray-800" },
  };

  const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

function ReviewStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: "待复核", className: "bg-yellow-100 text-yellow-800" },
    approved: { label: "已通过", className: "bg-green-100 text-green-800" },
    rejected: { label: "已驳回", className: "bg-red-100 text-red-800" },
    rework: { label: "需返工", className: "bg-orange-100 text-orange-800" },
  };

  const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

function ServiceRecordCard({
  record,
  showReviewStatus = false,
}: {
  record: ServiceRecordWithRelations;
  showReviewStatus?: boolean;
}) {
  const formatTime = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Link
      to={`/records/${record.id}`}
      className="block p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-gray-900 truncate">{record.elder.name}</h4>
            <StatusBadge status={record.status} />
            {showReviewStatus && record.latestReviewNode && (
              <ReviewStatusBadge status={record.latestReviewNode.reviewStatus} />
            )}
          </div>
          <p className="text-sm text-gray-500 mb-1">
            {record.elder.address}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(record.scheduledTime)}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {record.staff.name}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {record.serviceType}
            </span>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function RecordList({
  title,
  icon,
  iconBg,
  records,
  emptyText,
  showReviewStatus = false,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  records: ServiceRecordWithRelations[];
  emptyText: string;
  showReviewStatus?: boolean;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">共 {records.length} 条记录</p>
        </div>
      </div>
      <div className="space-y-3">
        {records.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {emptyText}
          </div>
        ) : (
          records.map((record) => (
            <ServiceRecordCard
              key={record.id}
              record={record}
              showReviewStatus={showReviewStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function Index() {
  const { todayScheduled, pendingReview, abnormalStuck } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">社区养老上门服务平台</h1>
                <p className="text-sm text-gray-500">预约与回访复核管理系统</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                今日: {new Date().toLocaleDateString("zh-CN")}
              </span>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecordList
            title="今日待上门"
            iconBg="bg-blue-100"
            icon={
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            records={todayScheduled}
            emptyText="今日暂无待上门服务"
          />

          <RecordList
            title="待回访复核"
            iconBg="bg-yellow-100"
            icon={
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
            records={pendingReview}
            emptyText="暂无待复核记录"
            showReviewStatus
          />

          <RecordList
            title="异常滞留记录"
            iconBg="bg-red-100"
            icon={
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            records={abnormalStuck}
            emptyText="暂无异常滞留记录"
            showReviewStatus
          />
        </div>

        <div className="mt-8 card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">业务样本说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="font-medium text-green-800">正常完成</span>
              </div>
              <p className="text-sm text-green-700">服务按时完成，老人满意，复核通过后归档</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                <span className="font-medium text-orange-800">老人未接听</span>
              </div>
              <p className="text-sm text-orange-700">上门时老人不在家或未接听，需二次回访确认</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                <span className="font-medium text-purple-800">服务时长冲突</span>
              </div>
              <p className="text-sm text-purple-700">实际服务时长与预约不符，需经办人补充说明</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="font-medium text-red-800">家属投诉</span>
              </div>
              <p className="text-sm text-red-700">家属投诉服务质量，需深入调查核实处理</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
