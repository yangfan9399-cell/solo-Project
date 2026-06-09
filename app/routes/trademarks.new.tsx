import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { requireRole } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import { z } from "zod";

export const meta: MetaFunction = () => {
  return [{ title: "登记新商标 - 商标续展管理系统" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["CONSULTANT"]);
  
  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return json({ user, clients });
}

const TrademarkSchema = z.object({
  trademarkNo: z.string().min(1, "商标号不能为空"),
  trademarkName: z.string().min(1, "商标名称不能为空"),
  category: z.coerce.number().int().min(1, "类别必须大于0").max(45, "类别不能超过45"),
  categoryName: z.string().min(1, "类别名称不能为空"),
  registrationDate: z.string().min(1, "注册日期不能为空"),
  expiryDate: z.string().min(1, "到期日期不能为空"),
  clientId: z.string().min(1, "请选择客户"),
  notes: z.string().optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireRole(request, ["CONSULTANT"]);
  const formData = await request.formData();

  const data = {
    trademarkNo: formData.get("trademarkNo"),
    trademarkName: formData.get("trademarkName"),
    category: formData.get("category"),
    categoryName: formData.get("categoryName"),
    registrationDate: formData.get("registrationDate"),
    expiryDate: formData.get("expiryDate"),
    clientId: formData.get("clientId"),
    notes: formData.get("notes"),
  };

  const result = TrademarkSchema.safeParse(data);
  if (!result.success) {
    return json(
      { errors: result.error.flatten().fieldErrors, data },
      { status: 400 }
    );
  }

  const trademark = await prisma.trademark.create({
    data: {
      trademarkNo: result.data.trademarkNo,
      trademarkName: result.data.trademarkName,
      category: result.data.category,
      categoryName: result.data.categoryName,
      registrationDate: new Date(result.data.registrationDate),
      expiryDate: new Date(result.data.expiryDate),
      consultantId: user.id,
      clientId: result.data.clientId,
      notes: result.data.notes,
      status: "PENDING_UPLOAD",
    },
  });

  await prisma.reviewHistory.create({
    data: {
      action: "创建商标登记",
      status: "PENDING_UPLOAD",
      trademarkId: trademark.id,
      userId: user.id,
      comment: "顾问登记商标，待客户上传材料",
    },
  });

  return redirect(`/trademarks/${trademark.id}`);
}

export default function NewTrademark() {
  const actionData = useActionData<typeof action>();
  const { clients } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold leading-7 text-gray-900">
          登记新商标
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary mt-4 md:mt-0"
        >
          返回
        </button>
      </div>

      <div className="card">
        <Form method="post" className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="trademarkNo"
                className="block text-sm font-medium text-gray-700"
              >
                商标号 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="trademarkNo"
                  id="trademarkNo"
                  defaultValue={String(actionData?.data?.trademarkNo || "")}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="例如：12345678"
                />
              </div>
              {actionData?.errors?.trademarkNo && (
                <p className="mt-2 text-sm text-red-600">
                  {actionData.errors.trademarkNo[0]}
                </p>
              )}
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="trademarkName"
                className="block text-sm font-medium text-gray-700"
              >
                商标名称 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="trademarkName"
                  id="trademarkName"
                  defaultValue={String(actionData?.data?.trademarkName || "")}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="例如：阿里巴巴"
                />
              </div>
              {actionData?.errors?.trademarkName && (
                <p className="mt-2 text-sm text-red-600">
                  {actionData.errors.trademarkName[0]}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700"
              >
                类别号 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="category"
                  id="category"
                  min="1"
                  max="45"
                  defaultValue={String(actionData?.data?.category || "")}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="例如：35"
                />
              </div>
              {actionData?.errors?.category && (
                <p className="mt-2 text-sm text-red-600">
                  {actionData.errors.category[0]}
                </p>
              )}
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="categoryName"
                className="block text-sm font-medium text-gray-700"
              >
                类别名称 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="categoryName"
                  id="categoryName"
                  defaultValue={String(actionData?.data?.categoryName || "")}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="例如：广告销售"
                />
              </div>
              {actionData?.errors?.categoryName && (
                <p className="mt-2 text-sm text-red-600">
                  {actionData.errors.categoryName[0]}
                </p>
              )}
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="registrationDate"
                className="block text-sm font-medium text-gray-700"
              >
                注册日期 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  name="registrationDate"
                  id="registrationDate"
                  defaultValue={String(actionData?.data?.registrationDate || "")}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              {actionData?.errors?.registrationDate && (
                <p className="mt-2 text-sm text-red-600">
                  {actionData.errors.registrationDate[0]}
                </p>
              )}
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="expiryDate"
                className="block text-sm font-medium text-gray-700"
              >
                到期日期 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  name="expiryDate"
                  id="expiryDate"
                  defaultValue={String(actionData?.data?.expiryDate || "")}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              {actionData?.errors?.expiryDate && (
                <p className="mt-2 text-sm text-red-600">
                  {actionData.errors.expiryDate[0]}
                </p>
              )}
            </div>

            <div className="sm:col-span-6">
              <label
                htmlFor="clientId"
                className="block text-sm font-medium text-gray-700"
              >
                客户 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="clientId"
                  name="clientId"
                  defaultValue={String(actionData?.data?.clientId || "")}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">请选择客户</option>
                  {clients.map((client: { id: string; name: string; email: string }) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>
              {actionData?.errors?.clientId && (
                <p className="mt-2 text-sm text-red-600">
                  {actionData.errors.clientId[0]}
                </p>
              )}
            </div>

            <div className="sm:col-span-6">
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700"
              >
                备注
              </label>
              <div className="mt-1">
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={String(actionData?.data?.notes || "")}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                  placeholder="添加备注信息..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              登记商标
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
