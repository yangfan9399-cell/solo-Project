import type { MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import { Link, useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { db } from "~/db";
import { registrations, participants, projects, groups, history } from "~/db/schema";
import { eq, and, inArray, ne } from "drizzle-orm";
import { formatDate, formatDateTime, getStatusColor, getStatusLabel, isDocumentExpired } from "~/lib/utils";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [{ title: "检录工作台" }];
};

export const loader: LoaderFunction = async () => {
  const pendingCheckIns = await db
    .select({
      id: registrations.id,
      registrationStatus: registrations.registrationStatus,
      checkInStatus: registrations.checkInStatus,
      clerkNotes: registrations.clerkNotes,
      refereeNotes: registrations.refereeNotes,
      registeredAt: registrations.registeredAt,
      participantName: participants.name,
      participantId: participants.id,
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
      checkInTime: groups.checkInTime,
    })
    .from(registrations)
    .innerJoin(participants, eq(registrations.participantId, participants.id))
    .innerJoin(projects, eq(registrations.projectId, projects.id))
    .innerJoin(groups, eq(registrations.groupId, groups.id))
    .where(
      and(
        eq(registrations.registrationStatus, "qualified"),
        inArray(registrations.checkInStatus, ["pending", "wrong_group"])
      )
    )
    .orderBy(groups.checkInTime);

  const allGroups = await db.select().from(groups);

  return { pendingCheckIns, allGroups };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const registrationId = Number(formData.get("registrationId"));
  const action = formData.get("action") as string;
  const notes = formData.get("notes") as string;
  const newGroupId = formData.get("newGroupId") ? Number(formData.get("newGroupId")) : undefined;

  if (action === "check_in") {
    await db.transaction(async (tx) => {
      await tx
        .update(registrations)
        .set({ checkInStatus: "checked_in" })
        .where(eq(registrations.id, registrationId));

      await tx.insert(history).values({
        registrationId,
        action: "checked_in",
        actorName: "检录员小张",
        details: notes || "准时到场，检录完成",
      });
    });
  }

  if (action === "mark_late") {
    await db.transaction(async (tx) => {
      await tx
        .update(registrations)
        .set({ checkInStatus: "late" })
        .where(eq(registrations.id, registrationId));

      await tx.insert(history).values({
        registrationId,
        action: "checked_in",
        actorName: "检录员小张",
        details: notes || "迟到，准予参赛",
      });
    });
  }

  if (action === "reject_checkin") {
    await db.transaction(async (tx) => {
      await tx
        .update(registrations)
        .set({ checkInStatus: "rejected" })
        .where(eq(registrations.id, registrationId));

      await tx.insert(history).values({
        registrationId,
        action: "checkin_rejected",
        actorName: "检录员小张",
        details: notes || "检录不通过",
      });
    });
  }

  if (action === "detect_wrong_group") {
    await db.transaction(async (tx) => {
      await tx
        .update(registrations)
        .set({ checkInStatus: "wrong_group" })
        .where(eq(registrations.id, registrationId));

      await tx.insert(history).values({
        registrationId,
        action: "wrong_group_detected",
        actorName: "检录员小张",
        details: notes || "发现组别错误，已阻止检录",
      });
    });
  }

  if (action === "change_group") {
    await db.transaction(async (tx) => {
      const reg = await tx
        .select()
        .from(registrations)
        .where(eq(registrations.id, registrationId))
        .limit(1);
      const oldGroupId = reg[0].groupId;

      await tx
        .update(registrations)
        .set({ groupId: newGroupId, checkInStatus: "pending" })
        .where(eq(registrations.id, registrationId));

      await tx.insert(history).values({
        registrationId,
        action: "group_changed",
        actorName: "检录员小张",
        details: `换组处理: ${notes || "组别调整后重新检录"}`,
        oldGroupId,
        newGroupId,
      });
    });
  }

  if (action === "withdraw") {
    await db.transaction(async (tx) => {
      await tx
        .update(registrations)
        .set({ checkInStatus: "rejected", registrationStatus: "disqualified" })
        .where(eq(registrations.id, registrationId));

      await tx.insert(history).values({
        registrationId,
        action: "withdrawn",
        actorName: "检录员小张",
        details: notes || "撤回报名",
      });
    });
  }

  return null;
};

export default function CheckinPage() {
  const { pendingCheckIns, allGroups } = useLoaderData<typeof loader>();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">检录工作台</h1>
              <p className="mt-1 text-green-100">到场确认 · 组别错误检测 · 异常处理</p>
            </div>
            <Link to="/" className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100">
              返回首页
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold">待检录列表 ({pendingCheckIns.length})</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {pendingCheckIns.length === 0 ? (
                <div className="p-8 text-center text-gray-500">暂无待检录记录</div>
              ) : (
                pendingCheckIns.map((reg: any) => (
                  <div
                    key={reg.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedId === reg.id ? "bg-green-50" : ""}`}
                    onClick={() => setSelectedId(reg.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{reg.participantName}</div>
                        <div className="text-sm text-gray-500">
                          {reg.projectName} - {reg.groupName}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          检录时间: {formatDateTime(reg.checkInTime)}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reg.checkInStatus)}`}>
                        {getStatusLabel(reg.checkInStatus)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            {selectedId ? (
              <CheckinDetail
                registration={pendingCheckIns.find((r: any) => r.id === selectedId)!}
                allGroups={allGroups}
              />
            ) : (
              <div className="p-8 text-center text-gray-500">请选择一个参赛者进行检录</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function CheckinDetail({ registration: reg, allGroups }: any) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showWrongGroupModal, setShowWrongGroupModal] = useState(false);

  const docExpired = reg && isDocumentExpired(reg.idExpiryDate);
  const isWrongGroup = reg?.checkInStatus === "wrong_group";
  const projectGroups = allGroups.filter((g: any) => g.projectId === reg?.projectId);
  const genderMismatch = reg && reg.gender !== reg.groupGender;

  if (!reg) return null;

  if (isWrongGroup) {
    return (
      <div className="divide-y divide-gray-200">
        <div className="px-6 py-4 bg-red-500 text-white">
          <h2 className="text-lg font-semibold">⚠️ 组别错误 - 已阻断检录</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-700 font-medium text-lg">检录已阻断</div>
            <div className="text-red-600 mt-1">检测到组别异常，请处理后再进行检录</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">参赛者</label>
              <div className="font-medium">{reg.participantName}</div>
              <div className="text-sm text-gray-500">性别: {reg.gender}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">当前组别</label>
              <div className="font-medium text-red-600">{reg.groupName}</div>
              <div className="text-sm text-gray-500">要求: {reg.groupGender}</div>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">处理说明</label>
            <textarea
              className="w-full border rounded-lg p-2"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="填写处理说明..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择正确组别（换组路径）
            </label>
            <select
              className="w-full border rounded-lg p-2"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="">请选择正确组别...</option>
              {projectGroups.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.gender}, {g.ageMin}-{g.ageMax}岁)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <fetcher.Form method="post">
              <input type="hidden" name="registrationId" value={reg.id} />
              <input type="hidden" name="action" value="change_group" />
              <input type="hidden" name="notes" value={notes} />
              <input type="hidden" name="newGroupId" value={selectedGroup} />
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                disabled={!selectedGroup || fetcher.state !== "idle"}
              >
                🔄 换组后重新检录
              </button>
            </fetcher.Form>

            <fetcher.Form method="post">
              <input type="hidden" name="registrationId" value={reg.id} />
              <input type="hidden" name="action" value="withdraw" />
              <input type="hidden" name="notes" value={notes} />
              <button
                type="submit"
                className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                disabled={fetcher.state !== "idle"}
              >
                ❌ 撤回报名
              </button>
            </fetcher.Form>
          </div>

          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 mt-4">
            <div className="font-medium text-gray-700 mb-2">处理路径说明：</div>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>换组路径</strong>：调整到正确组别后，可重新进入待检录队列</li>
              <li><strong>撤回路径</strong>：取消本次报名，参赛者退出比赛</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      <div className="px-6 py-4 bg-gray-50">
        <h2 className="text-lg font-semibold">检录验证</h2>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-700 font-medium">✓ 资格审核已通过</div>
          <div className="text-green-600 text-sm">{reg.refereeNotes}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">姓名</label>
            <div className="font-medium text-lg">{reg.participantName}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">性别</label>
            <div className="font-medium">{reg.gender}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">证件号码</label>
            <div className="font-mono text-sm">{reg.idNumber}</div>
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
          <label className="block text-sm font-medium text-gray-500 mb-2">报名信息</label>
          <div className="font-medium">{reg.projectName}</div>
          <div className="text-sm text-gray-500">
            组别: {reg.groupName} (要求: {reg.groupGender}, {reg.groupAgeMin}-{reg.groupAgeMax}岁)
          </div>
          <div className="text-sm text-gray-500">
            检录时间: {formatDateTime(reg.checkInTime)}
          </div>
        </div>

        {genderMismatch && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-yellow-700 font-medium">⚠️ 性别与组别不符</div>
            <div className="text-yellow-600 text-sm">请确认是否组别错误</div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">检录备注</label>
          <textarea
            className="w-full border rounded-lg p-2"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="填写检录备注..."
          />
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t">
        <h3 className="font-semibold">检录操作</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <fetcher.Form method="post">
            <input type="hidden" name="registrationId" value={reg.id} />
            <input type="hidden" name="action" value="check_in" />
            <input type="hidden" name="notes" value={notes} />
            <button
              type="submit"
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              disabled={fetcher.state !== "idle"}
            >
              ✓ 确认到场
            </button>
          </fetcher.Form>

          <fetcher.Form method="post">
            <input type="hidden" name="registrationId" value={reg.id} />
            <input type="hidden" name="action" value="mark_late" />
            <input type="hidden" name="notes" value={notes} />
            <button
              type="submit"
              className="w-full py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
              disabled={fetcher.state !== "idle"}
            >
              ⏰ 迟到登记
            </button>
          </fetcher.Form>

          <fetcher.Form method="post">
            <input type="hidden" name="registrationId" value={reg.id} />
            <input type="hidden" name="action" value="detect_wrong_group" />
            <input type="hidden" name="notes" value={notes} />
            <button
              type="submit"
              className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              disabled={fetcher.state !== "idle"}
            >
              ⚠️ 组别错误
            </button>
          </fetcher.Form>

          <fetcher.Form method="post">
            <input type="hidden" name="registrationId" value={reg.id} />
            <input type="hidden" name="action" value="reject_checkin" />
            <input type="hidden" name="notes" value={notes} />
            <button
              type="submit"
              className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              disabled={fetcher.state !== "idle"}
            >
              ✕ 退回
            </button>
          </fetcher.Form>
        </div>
      </div>
    </div>
  );
}
