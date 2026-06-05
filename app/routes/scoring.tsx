import type { MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import { Link, useLoaderData, useFetcher } from "@remix-run/react";
import { db } from "~/db";
import { registrations, participants, projects, groups, history } from "~/db/schema";
import { eq, and, inArray, ne, isNull } from "drizzle-orm";
import { formatDateTime, getStatusColor, getStatusLabel } from "~/lib/utils";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [{ title: "成绩归档" }];
};

export const loader: LoaderFunction = async () => {
  const checkedInRecords = await db
    .select({
      id: registrations.id,
      registrationStatus: registrations.registrationStatus,
      checkInStatus: registrations.checkInStatus,
      score: registrations.score,
      rank: registrations.rank,
      registeredAt: registrations.registeredAt,
      participantName: participants.name,
      projectName: projects.name,
      groupName: groups.name,
      checkInTime: groups.checkInTime,
    })
    .from(registrations)
    .innerJoin(participants, eq(registrations.participantId, participants.id))
    .innerJoin(projects, eq(registrations.projectId, projects.id))
    .innerJoin(groups, eq(registrations.groupId, groups.id))
    .where(
      inArray(registrations.checkInStatus, ["checked_in", "late"])
    )
    .orderBy(groups.checkInTime, registrations.id);

  return { checkedInRecords };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const registrationId = Number(formData.get("registrationId"));
  const actionType = formData.get("action") as string;
  const scoreValue = formData.get("score") as string;
  const rankValue = formData.get("rank") as string;

  if (actionType === "submit_score") {
    const score = Number(scoreValue);
    const rank = Number(rankValue);

    await db.transaction(async (tx) => {
      await tx
        .update(registrations)
        .set({ score, rank })
        .where(eq(registrations.id, registrationId));

      await tx.insert(history).values({
        registrationId,
        action: "score_submitted",
        actorName: "裁判李老师",
        details: `成绩录入: ${score > 1000 ? (score / 100).toFixed(2) + "秒" : score + "分"}, 排名: 第${rank}名`,
      });
    });
  }

  if (actionType === "clear_score") {
    await db.transaction(async (tx) => {
      await tx
        .update(registrations)
        .set({ score: null, rank: null })
        .where(eq(registrations.id, registrationId));

      await tx.insert(history).values({
        registrationId,
        action: "clerk_updated",
        actorName: "裁判李老师",
        details: "成绩已清空",
      });
    });
  }

  return null;
};

export default function ScoringPage() {
  const { checkedInRecords } = useLoaderData<typeof loader>();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedRecord = checkedInRecords.find((r: any) => r.id === selectedId);

  const scoredCount = checkedInRecords.filter((r: any) => r.score !== null).length;
  const pendingCount = checkedInRecords.filter((r: any) => r.score === null).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">成绩归档</h1>
              <p className="mt-1 text-orange-100">裁判录入成绩和名次 · 已检录参赛者</p>
            </div>
            <Link to="/" className="px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-gray-100">
              返回首页
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">已检录人数</div>
            <div className="text-2xl font-bold text-gray-900">{checkedInRecords.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">已归档成绩</div>
            <div className="text-2xl font-bold text-green-600">{scoredCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">待录入</div>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold">已检录列表</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[700px] overflow-y-auto">
              {checkedInRecords.length === 0 ? (
                <div className="p-8 text-center text-gray-500">暂无已检录记录</div>
              ) : (
                checkedInRecords.map((reg: any) => (
                  <div
                    key={reg.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedId === reg.id ? "bg-orange-50" : ""}`}
                    onClick={() => setSelectedId(reg.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {reg.participantName}
                          {reg.score !== null && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                              已归档
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reg.projectName} - {reg.groupName}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          检录时间: {formatDateTime(reg.checkInTime)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reg.checkInStatus)}`}>
                          {getStatusLabel(reg.checkInStatus)}
                        </span>
                        {reg.score !== null && (
                          <div className="mt-2">
                            <div className="text-lg font-bold text-orange-600">
                              {reg.score > 1000
                                ? (reg.score / 100).toFixed(2) + "s"
                                : reg.score + "分"}
                            </div>
                            <div className="text-sm text-gray-500">第{reg.rank}名</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            {selectedRecord ? (
              <ScoringForm record={selectedRecord} />
            ) : (
              <div className="p-8 text-center text-gray-500">
                请选择一个参赛者录入成绩
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ScoringForm({ record }: { record: any }) {
  const fetcher = useFetcher();
  const [score, setScore] = useState(record.score?.toString() || "");
  const [rank, setRank] = useState(record.rank?.toString() || "");

  const formatScoreDisplay = (value: string) => {
    if (!value) return "";
    const num = Number(value);
    if (num > 1000) {
      return (num / 100).toFixed(2) + " 秒";
    }
    return value + " 分";
  };

  return (
    <div className="divide-y divide-gray-200">
      <div className="px-6 py-4 bg-gray-50">
        <h2 className="text-lg font-semibold">成绩录入</h2>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="font-medium text-orange-800">{record.participantName}</div>
          <div className="text-sm text-orange-700">
            {record.projectName} - {record.groupName}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              当前检录状态
            </label>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.checkInStatus)}`}>
              {getStatusLabel(record.checkInStatus)}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              资格状态
            </label>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.registrationStatus)}`}>
              {getStatusLabel(record.registrationStatus)}
            </span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4">裁判录入成绩</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                成绩数值
                <span className="text-gray-400 text-xs ml-1">(跑步: 毫秒, 其他: 分)</span>
              </label>
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="例如: 10500 表示 10.50秒"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {score && (
                <div className="text-sm text-gray-500 mt-1">
                  显示: {formatScoreDisplay(score)}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名次
              </label>
              <input
                type="number"
                min="1"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                placeholder="例如: 1"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {rank && (
                <div className="text-sm text-gray-500 mt-1">
                  显示: 第{rank}名
                </div>
              )}
            </div>
          </div>
        </div>

        {record.score !== null && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-700">当前已归档成绩</div>
            <div className="text-2xl font-bold text-green-600">
              {record.score > 1000
                ? (record.score / 100).toFixed(2) + " 秒"
                : record.score + " 分"}
              <span className="text-lg ml-2">· 第{record.rank}名</span>
            </div>
          </div>
        )}

        <div className="border-t pt-4 space-y-3">
          <fetcher.Form method="post">
            <input type="hidden" name="registrationId" value={record.id} />
            <input type="hidden" name="action" value="submit_score" />
            <input type="hidden" name="score" value={score} />
            <input type="hidden" name="rank" value={rank} />
            <button
              type="submit"
              disabled={!score || !rank || fetcher.state !== "idle"}
              className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fetcher.state !== "idle" ? "提交中..." : "确认提交成绩归档"}
            </button>
          </fetcher.Form>

          {record.score !== null && (
            <fetcher.Form method="post">
              <input type="hidden" name="registrationId" value={record.id} />
              <input type="hidden" name="action" value="clear_score" />
              <button
                type="submit"
                disabled={fetcher.state !== "idle"}
                className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
              >
                清空成绩重新录入
              </button>
            </fetcher.Form>
          )}
        </div>

        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
          <div className="font-medium text-gray-700 mb-1">📋 操作说明</div>
          <ul className="space-y-1">
            <li>• 跑步项目成绩以<strong>毫秒</strong>为单位录入（如 10500 = 10.50秒）</li>
            <li>• 其他项目成绩以<strong>分</strong>为单位录入</li>
            <li>• 提交后将自动写入历史节点，详情页可查看</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
