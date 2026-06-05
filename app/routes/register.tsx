import type { MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import { Link, useLoaderData, useFetcher, redirect } from "@remix-run/react";
import { db } from "~/db";
import { projects, groups, participants, registrations, history } from "~/db/schema";
import { eq } from "drizzle-orm";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [{ title: "参赛者报名" }];
};

export const loader: LoaderFunction = async () => {
  const projectList = await db.select().from(projects).orderBy(projects.id);
  
  const groupList = await db
    .select({
      id: groups.id,
      name: groups.name,
      projectId: groups.projectId,
      ageMin: groups.ageMin,
      ageMax: groups.ageMax,
      gender: groups.gender,
    })
    .from(groups)
    .orderBy(groups.projectId, groups.id);

  return { projects: projectList, groups: groupList };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  
  const name = formData.get("name") as string;
  const idNumber = formData.get("idNumber") as string;
  const birthDate = formData.get("birthDate") as string;
  const gender = formData.get("gender") as string;
  const phone = formData.get("phone") as string;
  const idExpiryDate = formData.get("idExpiryDate") as string;
  const projectId = Number(formData.get("projectId"));
  const groupId = Number(formData.get("groupId"));

  const result = await db.transaction(async (tx) => {
    const [newParticipant] = await tx
      .insert(participants)
      .values({
        name,
        idNumber,
        birthDate: new Date(birthDate),
        gender,
        phone,
        idExpiryDate: new Date(idExpiryDate),
      } as any)
      .returning();

    const [newRegistration] = await tx
      .insert(registrations)
      .values({
        participantId: newParticipant.id,
        projectId,
        groupId,
      } as any)
      .returning();

    await tx.insert(history).values({
      registrationId: newRegistration.id,
      action: "registered",
      actorName: "在线报名系统",
      details: "参赛者在线报名成功",
    } as any);

    return newRegistration.id;
  });

  return redirect(`/registration/${result}`);
};

export default function RegisterPage() {
  const { projects, groups } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedGender, setSelectedGender] = useState("");

  const filteredGroups = groups.filter((g: any) => {
    const matchProject = !selectedProject || g.projectId === Number(selectedProject);
    const matchGender = !selectedGender || g.gender === selectedGender;
    return matchProject && matchGender;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">参赛者报名</h1>
              <p className="mt-1 text-blue-100">填写个人信息完成报名</p>
            </div>
            <Link to="/" className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100">
              返回首页
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <fetcher.Form method="post" className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="font-semibold text-blue-800 mb-2">📋 报名须知</h2>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 请如实填写个人信息，所有字段均为必填</li>
              <li>• 证件有效期需覆盖比赛期间</li>
              <li>• 请选择与您性别、年龄相符的组别</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">个人信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  性别 <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  required
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择性别</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  身份证号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="idNumber"
                  required
                  maxLength={18}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="请输入18位身份证号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  出生日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="birthDate"
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  maxLength={11}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入11位手机号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  证件有效期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="idExpiryDate"
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">参赛信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  参赛项目 <span className="text-red-500">*</span>
                </label>
                <select
                  name="projectId"
                  required
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择参赛项目</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  参赛组别 <span className="text-red-500">*</span>
                </label>
                <select
                  name="groupId"
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择组别</option>
                  {filteredGroups.map((g: any) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.gender}, {g.ageMin}-{g.ageMax}岁)
                    </option>
                  ))}
                </select>
                {selectedProject && filteredGroups.length === 0 && (
                  <p className="text-yellow-600 text-sm mt-1">
                    ⚠️ 该项目没有匹配您性别的组别
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <button
              type="submit"
              disabled={fetcher.state !== "idle"}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fetcher.state !== "idle" ? "提交中..." : "提交报名"}
            </button>
          </div>
        </fetcher.Form>
      </main>
    </div>
  );
}
