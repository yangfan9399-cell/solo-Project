import { useState } from "react";
import { Form, useActionData, useNavigation, useSearchParams } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { z } from "zod";
import { createUserSession, getUserId, verifyLogin } from "../../.server/session.server";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";

const loginSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().min(1, "密码不能为空"),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) {
    return redirect("/dashboard");
  }
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo") as string || "/dashboard";

  const result = loginSchema.safeParse({ username, password });
  if (!result.success) {
    return json({ 
      errors: result.error.flatten().fieldErrors,
      success: false 
    }, { status: 400 });
  }

  const user = await verifyLogin(result.data.username, result.data.password);
  if (!user) {
    return json({ 
      errors: { password: ["用户名或密码错误"] },
      success: false 
    }, { status: 400 });
  }

  return createUserSession(user.id, redirectTo);
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";

  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <Card.Header className="text-center">
          <div className="text-5xl mb-4">❤️</div>
          <Card.Title className="text-2xl">公益物资捐赠追踪系统</Card.Title>
          <p className="text-gray-500 mt-2 text-sm">请登录以继续使用系统</p>
        </Card.Header>
        <Card.Body>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                用户名
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入用户名"
              />
              {actionData?.errors?.username && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.username[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入密码"
              />
              {actionData?.errors?.password && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.password[0]}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "登录中..." : "登录"}
            </Button>
          </Form>
        </Card.Body>
        <Card.Footer className="text-center">
          <div className="text-sm text-gray-500">
            <p className="mb-1">测试账号：</p>
            <p className="text-xs">admin / 123456 (物资管理员)</p>
            <p className="text-xs">worker / 123456 (项目社工)</p>
            <p className="text-xs">manager / 123456 (机构负责人)</p>
          </div>
        </Card.Footer>
      </Card>
    </div>
  );
}
