import { Html, Head, Body } from "solid-start";
import { Suspense } from "solid-js";
import FileRoutes from "solid-start/root/FileRoutes";

export default function Root() {
  return (
    <Html lang="zh-CN">
      <Head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>培训报名资格审核与证书发放平台</title>
      </Head>
      <Body class="bg-gray-50 min-h-screen">
        <nav class="bg-indigo-700 text-white shadow-lg">
          <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" class="text-xl font-bold">培训报名资格审核与证书发放平台</a>
            <div class="flex gap-6 text-sm">
              <a href="/" class="hover:text-indigo-200">报名队列</a>
              <a href="/certificates" class="hover:text-indigo-200">证书管理</a>
              <a href="/disputes" class="hover:text-indigo-200">资格争议</a>
            </div>
          </div>
        </nav>
        <main class="max-w-7xl mx-auto px-4 py-6">
          <Suspense>
            <FileRoutes />
          </Suspense>
        </main>
      </Body>
    </Html>
  );
}
