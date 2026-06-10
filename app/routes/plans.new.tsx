import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useNavigation } from "@remix-run/react";
import { prisma } from "~/lib/db.server";
import { ArrowLeft, Plus } from "lucide-react";
import { Link } from "@remix-run/react";

export async function loader() {
  const [elevators, maintenanceUnits] = await Promise.all([
    prisma.elevator.findMany({
      include: {
        building: { include: { community: true } },
      },
    }),
    prisma.maintenanceUnit.findMany(),
  ]);

  return json({ elevators, maintenanceUnits });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const elevatorId = formData.get("elevatorId") as string;
  const maintenanceUnitId = formData.get("maintenanceUnitId") as string;
  const planDate = formData.get("planDate") as string;
  const dueDate = formData.get("dueDate") as string;

  if (!elevatorId || !maintenanceUnitId || !planDate || !dueDate) {
    return json({ error: "请填写所有必填字段" }, { status: 400 });
  }

  const plan = await prisma.maintenancePlan.create({
    data: {
      elevatorId,
      maintenanceUnitId,
      planDate: new Date(planDate),
      dueDate: new Date(dueDate),
      status: "待执行",
      riskLevel: "正常",
    },
  });

  await prisma.historyNode.create({
    data: {
      elevatorId,
      planId: plan.id,
      type: "计划创建",
      title: "维保计划创建",
      description: "物业管理员创建了新的维保计划",
      operator: "物业管理员",
      operatorRole: "物业管理员",
    },
  });

  return redirect(`/elevators/${elevatorId}`);
}

export default function NewPlan() {
  const { elevators, maintenanceUnits } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/plans"
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">新建维保计划</h1>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <Form method="post">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  选择电梯 <span className="text-red-500">*</span>
                </label>
                <select
                  name="elevatorId"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">请选择电梯</option>
                  {elevators.map((elevator: { id: string; code: string; building: { community: { name: string }; name: string } }) => (
                    <option key={elevator.id} value={elevator.id}>
                      {elevator.code} - {elevator.building.community.name} {elevator.building.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  维保单位 <span className="text-red-500">*</span>
                </label>
                <select
                  name="maintenanceUnitId"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">请选择维保单位</option>
                  {maintenanceUnits.map((unit: { id: string; name: string }) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    计划维保日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="planDate"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    截止日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  {isSubmitting ? "创建中..." : "创建计划"}
                </button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
