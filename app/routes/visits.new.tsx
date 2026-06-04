import { Link, Form, useActionData, useNavigation, useLoaderData } from "react-router";
import type { Route } from "./+types/visits.new";
import { db } from "~/lib/db.server";
import { redirect } from "react-router";
import { z } from "zod";
import { SourceType, AnomalyType } from "@prisma/client";
import { getAvailableSpots, occupySpot, validateSpotAvailable } from "~/lib/parkingSpot";

const createVisitSchema = z.object({
  visitorName: z.string().min(2, "访客姓名至少2个字符"),
  visitorPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  visitorCompany: z.string().optional(),
  licensePlate: z.string().min(7, "请输入有效的车牌号"),
  parkingSpotId: z.string().min(1, "请选择车位"),
  visitDate: z.string().min(1, "请选择访问日期"),
  startTime: z.string().min(1, "请选择开始时间"),
  endTime: z.string().min(1, "请选择结束时间"),
  source: z.nativeEnum(SourceType),
  hostName: z.string().min(2, "被访人姓名至少2个字符"),
  hostPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  hostDepartment: z.string().optional(),
  purpose: z.string().min(2, "请输入访问事由"),
});

export async function loader() {
  const availableSpots = await getAvailableSpots();
  return { availableSpots };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const validated = createVisitSchema.safeParse(data);

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      values: data,
    };
  }

  const spotValidation = await validateSpotAvailable(validated.data.parkingSpotId);
  if (!spotValidation.valid) {
    return {
      errors: { parkingSpotId: [spotValidation.error] },
      values: data,
    };
  }

  const visitDate = new Date(validated.data.visitDate);
  const [startHour, startMinute] = validated.data.startTime.split(":").map(Number);
  const [endHour, endMinute] = validated.data.endTime.split(":").map(Number);

  const startTime = new Date(visitDate);
  startTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(visitDate);
  endTime.setHours(endHour, endMinute, 0, 0);

  await db.visit.create({
    data: {
      visitorName: validated.data.visitorName,
      visitorPhone: validated.data.visitorPhone,
      visitorCompany: validated.data.visitorCompany,
      licensePlate: validated.data.licensePlate,
      originalPlate: validated.data.licensePlate,
      parkingSpotId: validated.data.parkingSpotId,
      originalSpotId: validated.data.parkingSpotId,
      visitDate,
      startTime,
      endTime,
      source: validated.data.source,
      hostName: validated.data.hostName,
      hostPhone: validated.data.hostPhone,
      hostDepartment: validated.data.hostDepartment,
      purpose: validated.data.purpose,
      anomalyType: AnomalyType.NONE,
      changeLogs: {
        create: [
          {
            fieldName: "status",
            oldValue: null,
            newValue: "PENDING",
            changedBy: "系统",
            note: "创建预约，车位已预留",
          },
          {
            fieldName: "parkingSpotId",
            oldValue: null,
            newValue: spotValidation.spot?.spotNumber,
            changedBy: "系统",
            note: "分配访客车位",
          },
        ],
      },
    },
  });

  await occupySpot(validated.data.parkingSpotId);

  return redirect("/visits");
}

export function meta(): Route.MetaDescriptions {
  return [{ title: "预约登记 - 物业访客车位管理平台" }];
}

export default function NewVisit() {
  const { availableSpots } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              ← 返回
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">📝 访客预约登记</h1>
              <p className="text-sm text-gray-500">录入访客车辆信息，分配访客车位</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          <span className="font-medium">💡 提示：</span>
          当前可用车位 {availableSpots.length} 个
        </div>

        <div className="card">
          <Form method="post" className="card-body space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">访客信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">访客姓名 *</label>
                  <input
                    type="text"
                    name="visitorName"
                    defaultValue={actionData?.values?.visitorName as string}
                    className="input"
                    placeholder="请输入访客姓名"
                  />
                  {actionData?.errors?.visitorName && (
                    <p className="text-red-500 text-sm mt-1">{actionData.errors.visitorName[0]}</p>
                  )}
                </div>
                <div>
                  <label className="label">联系电话 *</label>
                  <input
                    type="tel"
                    name="visitorPhone"
                    defaultValue={actionData?.values?.visitorPhone as string}
                    className="input"
                    placeholder="请输入手机号"
                  />
                  {actionData?.errors?.visitorPhone && (
                    <p className="text-red-500 text-sm mt-1">{actionData.errors.visitorPhone[0]}</p>
                  )}
                </div>
                <div>
                  <label className="label">所属单位</label>
                  <input
                    type="text"
                    name="visitorCompany"
                    defaultValue={actionData?.values?.visitorCompany as string}
                    className="input"
                    placeholder="请输入所属单位"
                  />
                </div>
                <div>
                  <label className="label">车牌号码 *</label>
                  <input
                    type="text"
                    name="licensePlate"
                    defaultValue={actionData?.values?.licensePlate as string}
                    className="input"
                    placeholder="如：京A12345"
                  />
                  {actionData?.errors?.licensePlate && (
                    <p className="text-red-500 text-sm mt-1">{actionData.errors.licensePlate[0]}</p>
                  )}
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">访客车位</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">选择车位 *</label>
                  <select name="parkingSpotId" className="input" required>
                    <option value="">请选择车位</option>
                    {availableSpots.map((spot) => (
                      <option key={spot.id} value={spot.id}>
                        {spot.spotNumber} - {spot.floor} {spot.zone}
                      </option>
                    ))}
                  </select>
                  {availableSpots.length === 0 && (
                    <p className="text-orange-600 text-sm mt-1">⚠️ 暂无可用车位，请先释放车位</p>
                  )}
                  {actionData?.errors?.parkingSpotId && (
                    <p className="text-red-500 text-sm mt-1">{actionData.errors.parkingSpotId[0]}</p>
                  )}
                </div>
                <div>
                  <label className="label">预约来源</label>
                  <select name="source" className="input">
                    <option value="WECHAT">微信预约</option>
                    <option value="APP">APP预约</option>
                    <option value="PHONE">电话预约</option>
                    <option value="ONSITE">现场登记</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">访问时间</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">访问日期 *</label>
                  <input
                    type="date"
                    name="visitDate"
                    min={today}
                    defaultValue={actionData?.values?.visitDate as string}
                    className="input"
                  />
                  {actionData?.errors?.visitDate && (
                    <p className="text-red-500 text-sm mt-1">{actionData.errors.visitDate[0]}</p>
                  )}
                </div>
                <div>
                  <label className="label">开始时间 *</label>
                  <input
                    type="time"
                    name="startTime"
                    defaultValue={actionData?.values?.startTime as string}
                    className="input"
                  />
                  {actionData?.errors?.startTime && (
                    <p className="text-red-500 text-sm mt-1">{actionData.errors.startTime[0]}</p>
                  )}
                </div>
                <div>
                  <label className="label">结束时间 *</label>
                  <input
                    type="time"
                    name="endTime"
                    defaultValue={actionData?.values?.endTime as string}
                    className="input"
                  />
                  {actionData?.errors?.endTime && (
                    <p className="text-red-500 text-sm mt-1">{actionData.errors.endTime[0]}</p>
                  )}
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">被访人信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">被访人姓名 *</label>
                  <input
                    type="text"
                    name="hostName"
                    defaultValue={actionData?.values?.hostName as string}
                    className="input"
                    placeholder="请输入被访人姓名"
                  />
                  {actionData?.errors?.hostName && (
                    <p className="text-red-500 text-sm mt-1">{actionData.errors.hostName[0]}</p>
                  )}
                </div>
                <div>
                  <label className="label">联系电话 *</label>
                  <input
                    type="tel"
                    name="hostPhone"
                    defaultValue={actionData?.values?.hostPhone as string}
                    className="input"
                    placeholder="请输入手机号"
                  />
                  {actionData?.errors?.hostPhone && (
                    <p className="text-red-500 text-sm mt-1">{actionData.errors.hostPhone[0]}</p>
                  )}
                </div>
                <div>
                  <label className="label">所属部门</label>
                  <input
                    type="text"
                    name="hostDepartment"
                    defaultValue={actionData?.values?.hostDepartment as string}
                    className="input"
                    placeholder="请输入所属部门"
                  />
                </div>
                <div>
                  <label className="label">访问事由 *</label>
                  <input
                    type="text"
                    name="purpose"
                    defaultValue={actionData?.values?.purpose as string}
                    className="input"
                    placeholder="请输入访问事由"
                  />
                  {actionData?.errors?.purpose && (
                    <p className="text-red-500 text-sm mt-1">{actionData.errors.purpose[0]}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link to="/" className="btn btn-secondary">
                取消
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || availableSpots.length === 0}
              >
                {isSubmitting ? "提交中..." : "提交预约"}
              </button>
            </div>
          </Form>
        </div>
      </main>
    </div>
  );
}
