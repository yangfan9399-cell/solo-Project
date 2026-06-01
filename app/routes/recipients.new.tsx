import { Form, useLoaderData, useActionData, useNavigation, useNavigate } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { z } from "zod";
import { requireRole } from "../../.server/session.server";
import { prisma } from "../../.server/db.server";
import { AppLayout } from "~/components/layout/AppLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

const recipientSchema = z.object({
  name: z.string().min(1, "姓名不能为空"),
  idCard: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireRole(request, ["SOCIAL_WORKER", "MANAGER"]);
  const formData = await request.formData();

  const result = recipientSchema.safeParse({
    name: formData.get("name"),
    idCard: formData.get("idCard"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    category: formData.get("category"),
    description: formData.get("description"),
  });

  if (!result.success) {
    return json({ errors: result.error.flatten().fieldErrors, success: false }, { status: 400 });
  }

  await prisma.recipient.create({
    data: result.data,
  });

  return redirect("/recipients");
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["SOCIAL_WORKER", "MANAGER"]);
  return json({ user });
}

export default function NewRecipient() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  return (
    <AppLayout user={loaderData.user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">新建受助对象</h1>
          <Button variant="secondary" onClick={() => navigate("/recipients")}>
            取消
          </Button>
        </div>

        <Form method="post">
          <Card>
            <Card.Body className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    身份证号
                  </label>
                  <input
                    type="text"
                    name="idCard"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入身份证号"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    联系电话
                  </label>
                  <input
                    type="text"
                    name="phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入联系电话"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    受助类别
                  </label>
                  <select
                    name="category"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">请选择类别</option>
                    <option value="低保户">低保户</option>
                    <option value="特困户">特困户</option>
                    <option value="困境儿童">困境儿童</option>
                    <option value="残疾人">残疾人</option>
                    <option value="困难职工">困难职工</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  家庭住址
                </label>
                <input
                  type="text"
                  name="address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入家庭住址"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  情况说明
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入情况说明"
                />
              </div>
            </Card.Body>
            <Card.Footer className="flex justify-end gap-4">
              <Button variant="secondary" type="button" onClick={() => navigate("/recipients")}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "提交"}
              </Button>
            </Card.Footer>
          </Card>
        </Form>
      </div>
    </AppLayout>
  );
}
