import { component$, Slot, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$, Link, useLocation } from "@builder.io/qwik-city";
import prisma from "~/lib/prisma";
import { userCookie, getCurrentUser } from "~/lib/auth";
import type { UserInfo } from "~/lib/types";

export const useAuthLoader = routeLoader$(async (requestEvent) => {
  const cookie = userCookie.get(requestEvent);
  let currentUser: UserInfo | null = null;

  if (cookie) {
    try {
      const userId = JSON.parse(cookie);
      currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
        },
      });
    } catch {
      currentUser = null;
    }
  }

  if (!currentUser) {
    const firstUser = await prisma.user.findFirst({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      },
    });
    if (firstUser) {
      currentUser = firstUser;
      userCookie.set(requestEvent, JSON.stringify(currentUser.id));
    }
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
    },
    orderBy: { role: "asc" },
  });

  const unreadNotifications = currentUser
    ? await prisma.notification.count({
        where: {
          userId: currentUser.id,
          isRead: false,
        },
      })
    : 0;

  return {
    currentUser,
    users,
    unreadNotifications,
  };
});

export default component$(() => {
  const auth = useAuthLoader();
  const loc = useLocation();

  const handleSwitchUser = async (userId: string) => {
    const formData = new FormData();
    formData.append("userId", userId);

    await fetch("/api/auth/switch-user", {
      method: "POST",
      body: formData,
    });

    window.location.reload();
  };

  const activePath = loc.url.pathname;

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center space-x-8">
              <h1 class="text-xl font-bold text-gray-900">
                ♻️ 社区垃圾分类巡查与整改销项系统
              </h1>
              <nav class="hidden md:flex space-x-4">
                <Link
                  href="/"
                  class={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activePath === "/"
                      ? "bg-green-100 text-green-800"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  巡查列表
                </Link>
                <Link
                  href="/notifications"
                  class={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    activePath.startsWith("/notifications")
                      ? "bg-green-100 text-green-800"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  通知中心
                  {auth.value.unreadNotifications > 0 && (
                    <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {auth.value.unreadNotifications}
                    </span>
                  )}
                </Link>
              </nav>
            </div>

            <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-500">
                当前角色：
                <span class={`font-medium ${
                  auth.value.currentUser?.role === "INSPECTOR"
                    ? "text-blue-600"
                    : auth.value.currentUser?.role === "REVIEWER"
                    ? "text-purple-600"
                    : "text-gray-600"
                }`}>
                  {auth.value.currentUser?.role === "INSPECTOR"
                    ? "巡查员"
                    : auth.value.currentUser?.role === "REVIEWER"
                    ? "复核员"
                    : "管理员"}
                </span>
              </div>

              <div class="relative">
                <select
                  class="appearance-none bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                  value={auth.value.currentUser?.id}
                  onChange$={(e) => handleSwitchUser((e.target as HTMLSelectElement).value)}
                >
                  {auth.value.users.map((user) => {
                    const label = `${user.name} (${user.role === "INSPECTOR" ? "巡查员" : user.role === "REVIEWER" ? "复核员" : "管理员"})`;
                    return (
                      <option key={user.id} value={user.id} label={label}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Slot />
      </main>

      <footer class="bg-white border-t border-gray-200 mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p class="text-center text-sm text-gray-500">
            社区垃圾分类巡查与整改销项系统 © {new Date().getFullYear()} | 巡查员与复核员协同处理平台
          </p>
        </div>
      </footer>
    </div>
  );
});
