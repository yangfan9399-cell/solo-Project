import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import { getUserId, createUserSession, bcrypt } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import { z } from "zod";

export const meta: MetaFunction = () => {
  return [{ title: "登录 - 商标续展管理系统" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
}

const LoginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  const result = LoginSchema.safeParse({ email, password });
  if (!result.success) {
    return json(
      { errors: result.error.flatten().fieldErrors, email, password: "" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: result.data.email },
  });

  if (!user) {
    return json(
      { errors: { email: ["用户不存在"], password: [] }, email, password: "" },
      { status: 400 }
    );
  }

  const isCorrectPassword = await bcrypt.compare(
    result.data.password,
    user.password
  );

  if (!isCorrectPassword) {
    return json(
      { errors: { email: [], password: ["密码错误"] }, email, password: "" },
      { status: 400 }
    );
  }

  return createUserSession(user.id, "/");
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const demoAccounts = [
    { email: "consultant@example.com", password: "password123", role: "顾问" },
    { email: "client@example.com", password: "password123", role: "客户" },
    { email: "agent@example.com", password: "password123", role: "代理人" },
    { email: "supervisor@example.com", password: "password123", role: "主管" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            商标续展管理系统
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            知识产权商标续展提醒与材料审核系统
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Form method="post" className="space-y-6">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                邮箱地址
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  defaultValue={String(actionData?.email || "")}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              {actionData?.errors?.email && (
                <p className="mt-2 text-sm text-red-600">
                  {actionData.errors.email[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                密码
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              {actionData?.errors?.password && (
                <p className="mt-2 text-sm text-red-600">
                  {actionData.errors.password[0]}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                登录
              </button>
            </div>
          </Form>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">演示账号：</h3>
            <div className="space-y-1 text-xs text-gray-500">
              {demoAccounts.map((account) => (
                <div key={account.email} className="flex justify-between">
                  <span>{account.role}</span>
                  <span className="font-mono">
                    {account.email} / {account.password}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
