import type { MetaFunction, LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/db";
import { registrations, participants, projects, groups, history, reviews } from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatDate, formatDateTime, getStatusColor, getStatusLabel, getActionLabel, isDocumentExpired } from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [{ title: "报名详情" }];
};

export const loader: LoaderFunction = async ({ params }) => {
  const id = Number(params.id);

  const [registration] = await db
    .select({
      id: registrations.id,
      registrationStatus: registrations.registrationStatus,
      checkInStatus: registrations.checkInStatus,
      clerkNotes: registrations.clerkNotes,
      refereeNotes: registrations.refereeNotes,
      score: registrations.score,
      rank: registrations.rank,
      registeredAt: registrations.registeredAt,
      participantName: participants.name,
      idNumber: participants.idNumber,
      birthDate: participants.birthDate,
      gender: participants.gender,
      phone: participants.phone,
      idExpiryDate: participants.idExpiryDate,
      projectName: projects.name,
      groupName: groups.name,
      groupAgeMin: groups.ageMin,
      groupAgeMax: groups.ageMax,
      groupGender: groups.gender,
      checkInTime: groups.checkInTime,
    })
    .from(registrations)
    .innerJoin(participants, eq(registrations.participantId, participants.id))
    .innerJoin(projects, eq(registrations.projectId, projects.id))
    .innerJoin(groups, eq(registrations.groupId, groups.id))
    .where(eq(registrations.id, id));

  const historyRecords = await db
    .select()
    .from(history)
    .where(eq(history.registrationId, id))
    .orderBy(desc(history.timestamp));

  const reviewRecords = await db
    .select()
    .from(reviews)
    .where(eq(reviews.registrationId, id))
    .orderBy(desc(reviews.reviewedAt));

  return { registration, history: historyRecords, reviews: reviewRecords };
};

export default function RegistrationDetail() {
  const { registration, history, reviews } = useLoaderData<typeof loader>();
  const docExpired = isDocumentExpired(registration.idExpiryDate);
  const genderMismatch = registration.gender !== registration.groupGender;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">报名详情</h1>
              <p className="mt-1 text-indigo-100">参赛记录与流程历史</p>
            </div>
            <Link to="/" className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-gray-100">
              返回首页
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">参赛者信息</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">姓名</label>
                <div className="font-medium text-lg">{registration.participantName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">性别</label>
                <div className="font-medium">{registration.gender}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">出生日期</label>
                <div>{formatDate(registration.birthDate)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">身份证号</label>
                <div className="font-mono">{registration.idNumber}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">联系电话</label>
                <div>{registration.phone}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">证件有效期</label>
                <div className={docExpired ? "text-red-600 font-medium" : ""}>
                  {formatDate(registration.idExpiryDate)}
                  {docExpired && <span className="ml-2 text-red-500">(已过期)</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">报名信息</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">参赛项目</label>
                <div className="font-medium">{registration.projectName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">参赛组别</label>
                <div className="font-medium">
                  {registration.groupName}
                  {genderMismatch && <span className="ml-2 text-yellow-600 text-sm">(性别不符)</span>}
                </div>
                <div className="text-sm text-gray-500">
                  要求: {registration.groupGender}, {registration.groupAgeMin}-{registration.groupAgeMax}岁
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">资格状态</label>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(registration.registrationStatus)}`}>
                  {getStatusLabel(registration.registrationStatus)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">检录状态</label>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(registration.checkInStatus)}`}>
                  {getStatusLabel(registration.checkInStatus)}
                </span>
              </div>
            </div>

            <div className={`mt-6 pt-6 border-t ${
              (registration.checkInStatus === "checked_in" || registration.checkInStatus === "late")
                ? ""
                : "hidden"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">比赛成绩</h3>
                {!registration.score && (
                  <Link
                    to="/scoring"
                    className="text-sm px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                  >
                    🏆 去录入成绩
                  </Link>
                )}
              </div>

              {(registration.score || registration.rank) ? (
                <div className="grid grid-cols-2 gap-4">
                  {registration.score && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-indigo-700">成绩</label>
                      <div className="text-2xl font-bold text-indigo-600">
                        {registration.score > 1000
                          ? (registration.score / 100).toFixed(2) + " 秒"
                          : registration.score + " 分"}
                      </div>
                    </div>
                  )}
                  {registration.rank && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-green-700">排名</label>
                      <div className="text-2xl font-bold text-green-600">第 {registration.rank} 名</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg p-6 text-center">
                  <div className="text-gray-400 text-lg">⏳ 成绩待录入</div>
                  <div className="text-sm text-gray-500 mt-1">参赛者已检录，等待裁判录入成绩</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">审核意见</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-orange-200 text-orange-800 rounded text-xs font-medium">
                  经办人
                </span>
              </div>
              <div className="text-gray-700">{registration.clerkNotes || "无"}</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-indigo-200 text-indigo-800 rounded text-xs font-medium">
                  裁判
                </span>
              </div>
              <div className="text-gray-700">{registration.refereeNotes || "无"}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">流程历史</h2>
          </div>
          <div className="p-6">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {history.map((item: any, index: number) => (
                  <div key={item.id} className="relative pl-10">
                    <div className="absolute left-2 w-5 h-5 bg-indigo-500 rounded-full border-4 border-white shadow"></div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.action.includes("approved") || item.action.includes("checked_in")
                            ? "bg-green-100 text-green-800"
                            : item.action.includes("rejected") || item.action.includes("expired")
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {getActionLabel(item.action)}
                        </span>
                        <span className="text-sm text-gray-500">{formatDateTime(item.timestamp)}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{item.actorName}</span>
                        {item.details && <span className="ml-2">— {item.details}</span>}
                      </div>
                      {item.oldGroupId && (
                        <div className="mt-2 text-xs text-gray-500">
                          组别变更记录已存档
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
