import type { MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import { Link, useLoaderData, useFetcher } from "@remix-run/react";
import { db } from "~/db";
import { registrations, participants, projects, groups, reviews, history } from "~/db/schema";
import { eq, inArray } from "drizzle-orm";
import { formatDate, formatDateTime, getStatusColor, getStatusLabel, isDocumentExpired } from "~/lib/utils";
import { useState, useEffect, useRef } from "react";

export const meta: MetaFunction = () => {
  return [{ title: "资格审核工作台" }];
};

export const loader: LoaderFunction = async () => {
  const pendingReviews = await db
    .select({
      id: registrations.id,
      registrationStatus: registrations.registrationStatus,
      checkInStatus: registrations.checkInStatus,
      clerkNotes: registrations.clerkNotes,
      refereeNotes: registrations.refereeNotes,
      registeredAt: registrations.registeredAt,
      participantId: participants.id,
      participantName: participants.name,
      idNumber: participants.idNumber,
      birthDate: participants.birthDate,
      gender: participants.gender,
      phone: participants.phone,
      idExpiryDate: participants.idExpiryDate,
      projectName: projects.name,
      projectId: projects.id,
      groupName: groups.name,
      groupId: groups.id,
      groupAgeMin: groups.ageMin,
      groupAgeMax: groups.ageMax,
      groupGender: groups.gender,
    })
    .from(registrations)
    .innerJoin(participants, eq(registrations.participantId, participants.id))
    .innerJoin(projects, eq(registrations.projectId, projects.id))
    .innerJoin(groups, eq(registrations.groupId, groups.id))
    .where(inArray(registrations.registrationStatus, ["pending", "needs_info"]))
    .orderBy(registrations.registeredAt);

  const allGroups = await db.select().from(groups);

  return { pendingReviews, allGroups };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const registrationId = Number(formData.get("registrationId"));
  const actionType = formData.get("action") as string;
  const notes = formData.get("notes") as string;
  const groupIdStr = formData.get("groupId") as string;
  const groupId = groupIdStr ? Number(groupIdStr) : undefined;

  const [registration] = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, registrationId))
    .limit(1);

  if (!registration) {
    return { error: "报名记录不存在", registrationId };
  }

  if (actionType === "clerk_update") {
    if (groupId) {
      const [targetGroup] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, groupId))
        .limit(1);

      if (!targetGroup) {
        return { error: "目标组别不存在", registrationId };
      }

      if (targetGroup.projectId !== registration.projectId) {
        return { error: "只能调整到同一项目下的其他组别", registrationId };
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(registrations)
        .set({
          clerkNotes: notes,
          registrationStatus: groupId ? "pending" : "needs_info",
        })
        .where(eq(registrations.id, registrationId));

      if (groupId) {
        const oldGroupId = registration.groupId;

        await tx
          .update(registrations)
          .set({ groupId })
          .where(eq(registrations.id, registrationId));

        await tx.insert(history).values({
          registrationId,
          action: "group_changed",
          actorName: "经办人小王",
          details: `组别调整: ${notes || "经办人调整组别"}`,
          oldGroupId,
          newGroupId: groupId,
        } as any);
      } else {
        await tx.insert(history).values({
          registrationId,
          action: "clerk_updated",
          actorName: "经办人小王",
          details: notes,
        } as any);
      }

      await tx.insert(reviews).values({
        registrationId,
        reviewerRole: "clerk",
        reviewerName: "经办人小王",
        decision: groupId ? "组别调整" : "资料补充",
        notes,
      } as any);
    });

    return { success: true, registrationId, action: "clerk_update" };
  }

  if (actionType === "referee_approve" || actionType === "referee_reject") {
    if (
      registration.registrationStatus !== "pending" &&
      registration.registrationStatus !== "needs_info"
    ) {
      return { error: "仅待处理或需补资料的记录可进行裁判审核", registrationId };
    }

    await db.transaction(async (tx) => {
      if (actionType === "referee_approve") {
        await tx
          .update(registrations)
          .set({
            registrationStatus: "qualified",
            refereeNotes: notes,
          })
          .where(eq(registrations.id, registrationId));

        await tx.insert(history).values({
          registrationId,
          action: "referee_approved",
          actorName: "裁判李老师",
          details: notes || "资格审核通过",
        } as any);

        await tx.insert(reviews).values({
          registrationId,
          reviewerRole: "referee",
          reviewerName: "裁判李老师",
          decision: "通过",
          notes,
        } as any);
      } else {
        await tx
          .update(registrations)
          .set({
            registrationStatus: "disqualified",
            checkInStatus: "rejected",
            refereeNotes: notes,
          })
          .where(eq(registrations.id, registrationId));

        await tx.insert(history).values({
          registrationId,
          action: "referee_rejected",
          actorName: "裁判李老师",
          details: notes || "资格审核不通过",
        } as any);

        await tx.insert(reviews).values({
          registrationId,
          reviewerRole: "referee",
          reviewerName: "裁判李老师",
          decision: "不通过",
          notes,
        } as any);
      }
    });

    return { success: true, registrationId, action: actionType };
  }

  return { error: "无效操作", registrationId };
};

export default function ReviewPage() {
  const { pendingReviews, allGroups } = useLoaderData<typeof loader>();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const prevListRef = useRef<number[]>([]);

  useEffect(() => {
    const currentIds = pendingReviews.map((r: any) => r.id);
    const prevIds = prevListRef.current;

    if (selectedId !== null && !currentIds.includes(selectedId)) {
      const prevIndex = prevIds.indexOf(selectedId);
      if (prevIndex >= 0) {
        if (currentIds.length > 0) {
          const nextIndex = Math.min(prevIndex, currentIds.length - 1);
          setSelectedId(currentIds[nextIndex]);
        } else {
          setSelectedId(null);
        }
      }
    }

    prevListRef.current = currentIds;
  }, [pendingReviews, selectedId]);

  const selectedRecord = pendingReviews.find((r: any) => r.id === selectedId);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">资格审核工作台</h1>
              <p className="mt-1 text-indigo-100">经办人补资料 · 组别调整 · 裁判复核</p>
            </div>
            <Link to="/" className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-gray-100">
              返回首页
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold">待审核列表 ({pendingReviews.length})</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {pendingReviews.length === 0 ? (
                <div className="p-8 text-center text-gray-500">暂无待审核记录</div>
              ) : (
                pendingReviews.map((reg: any) => (
                  <div
                    key={reg.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedId === reg.id ? "bg-indigo-50" : ""}`}
                    onClick={() => setSelectedId(reg.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{reg.participantName}</div>
                        <div className="text-sm text-gray-500">
                          {reg.projectName} - {reg.groupName}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          报名时间: {formatDateTime(reg.registeredAt)}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reg.registrationStatus)}`}>
                        {getStatusLabel(reg.registrationStatus)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            {selectedRecord ? (
              <ReviewDetail
                key={selectedId}
                registration={selectedRecord}
                allGroups={allGroups}
              />
            ) : (
              <div className="p-8 text-center text-gray-500">请选择一个报名记录进行审核</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ReviewDetail({ registration: reg, allGroups }: { registration: any; allGroups: any }) {
  const fetcher = useFetcher<typeof action>();
  const [clerkNotes, setClerkNotes] = useState("");
  const [refereeNotes, setRefereeNotes] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const prevRegId = useRef<number | null>(null);

  useEffect(() => {
    if (!reg) return;
    if (prevRegId.current !== reg.id) {
      prevRegId.current = reg.id;
      setClerkNotes(reg.clerkNotes || "");
      setRefereeNotes(reg.refereeNotes || "");
      setSelectedGroup(reg.groupId?.toString() || "");
    }
  }, [reg]);

  useEffect(() => {
    if (
      fetcher.data?.success &&
      fetcher.data.registrationId === reg?.id &&
      fetcher.state === "idle"
    ) {
      setClerkNotes("");
      setRefereeNotes("");
      setSelectedGroup("");
    }
  }, [fetcher.data, fetcher.state, reg?.id]);

  if (!reg) {
    return (
      <div className="p-8 text-center text-gray-500">请选择一个报名记录进行审核</div>
    );
  }

  const docExpired = isDocumentExpired(reg.idExpiryDate);
  const projectGroups = allGroups.filter((g: any) => g.projectId === reg.projectId);

  const error =
    fetcher.data?.error && fetcher.data.registrationId === reg.id
      ? fetcher.data.error
      : null;

  const canRefereeAction =
    reg.registrationStatus === "pending" ||
    reg.registrationStatus === "needs_info";

  return (
    <div className="divide-y divide-gray-200">
      <div className="px-6 py-4 bg-gray-50">
        <h2 className="text-lg font-semibold">参赛者信息</h2>
      </div>

      <div className="p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-700 font-medium">⚠️ {error}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">姓名</label>
            <div className="font-medium">{reg.participantName}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">性别</label>
            <div className="font-medium">{reg.gender}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">身份证号</label>
            <div className="font-mono text-sm">{reg.idNumber}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">出生日期</label>
            <div>{formatDate(reg.birthDate)}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">联系电话</label>
            <div>{reg.phone}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">证件有效期</label>
            <div className={docExpired ? "text-red-600 font-medium" : ""}>
              {formatDate(reg.idExpiryDate)}
              {docExpired && <span className="ml-2 text-red-500">(已过期)</span>}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-500 mb-2">报名项目</label>
          <div className="font-medium">{reg.projectName}</div>
          <div className="text-sm text-gray-500">
            当前组别: {reg.groupName} (要求: {reg.groupGender}, {reg.groupAgeMin}-{reg.groupAgeMax}岁)
          </div>
        </div>

        {docExpired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-700 font-medium">⚠️ 证件已过期</div>
            <div className="text-red-600 text-sm">参赛者证件已过期，请通知更新</div>
          </div>
        )}

        {reg.gender !== reg.groupGender && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-yellow-700 font-medium">⚠️ 性别不符</div>
            <div className="text-yellow-600 text-sm">参赛者性别与组别要求不符，建议调整组别</div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-orange-50 border-t">
        <h3 className="font-semibold text-orange-800">经办人操作</h3>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">经办人备注</label>
          <textarea
            className={`w-full border rounded-lg p-2 ${
              error?.includes("组别") || error?.includes("资料") ? "border-red-500" : ""
            }`}
            rows={2}
            value={clerkNotes}
            onChange={(e) => setClerkNotes(e.target.value)}
            placeholder="填写资料补充说明..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            调整组别（如需）
            <span className="text-gray-400 text-xs ml-1">仅限同一项目下的组别</span>
          </label>
          <select
            className={`w-full border rounded-lg p-2 ${
              error?.includes("组别") ? "border-red-500" : ""
            }`}
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="">不调整</option>
            {projectGroups.map((g: any) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.gender}, {g.ageMin}-{g.ageMax}岁)
              </option>
            ))}
          </select>
        </div>
        <fetcher.Form method="post">
          <input type="hidden" name="registrationId" value={reg.id} />
          <input type="hidden" name="action" value="clerk_update" />
          <input type="hidden" name="notes" value={clerkNotes} />
          <input type="hidden" name="groupId" value={selectedGroup} />
          <button
            type="submit"
            className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            disabled={fetcher.state !== "idle"}
          >
            {fetcher.state !== "idle" ? "处理中..." : "保存经办人操作"}
          </button>
        </fetcher.Form>
      </div>

      <div className="px-6 py-4 bg-indigo-50 border-t">
        <h3 className="font-semibold text-indigo-800">裁判复核</h3>
      </div>
      <div className="p-6 space-y-4">
        {!canRefereeAction && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-gray-600 text-sm">
              当前状态：<strong>{getStatusLabel(reg.registrationStatus)}</strong>
            </div>
            <div className="text-gray-500 text-sm mt-1">
              仅「待处理」或「需补资料」状态的记录可进行裁判审核
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">裁判审核意见</label>
          <textarea
            className={`w-full border rounded-lg p-2 ${
              error?.includes("裁判") ? "border-red-500" : ""
            }`}
            rows={2}
            value={refereeNotes}
            onChange={(e) => setRefereeNotes(e.target.value)}
            placeholder="填写审核意见..."
            disabled={!canRefereeAction}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <fetcher.Form method="post">
            <input type="hidden" name="registrationId" value={reg.id} />
            <input type="hidden" name="action" value="referee_approve" />
            <input type="hidden" name="notes" value={refereeNotes} />
            <button
              type="submit"
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={!canRefereeAction || fetcher.state !== "idle"}
            >
              通过资格
            </button>
          </fetcher.Form>
          <fetcher.Form method="post">
            <input type="hidden" name="registrationId" value={reg.id} />
            <input type="hidden" name="action" value="referee_reject" />
            <input type="hidden" name="notes" value={refereeNotes} />
            <button
              type="submit"
              className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              disabled={!canRefereeAction || fetcher.state !== "idle"}
            >
              取消资格
            </button>
          </fetcher.Form>
        </div>
        {!canRefereeAction && (
          <p className="text-xs text-gray-500 text-center">
            该记录状态已处理，不可重复提交
          </p>
        )}
      </div>
    </div>
  );
}
