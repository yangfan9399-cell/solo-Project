import { routeAction$, routeLoader$, z, zod$, type RequestEventLoader, type RequestEventAction } from "@builder.io/qwik-city";
import prisma from "~/lib/prisma";
import { userCookie } from "~/lib/auth";
import type { UserInfo } from "~/lib/types";

export const useSwitchUser = routeAction$(
  async (form, requestEvent: RequestEventAction) => {
    const { userId } = form;

    if (!userId) {
      return requestEvent.json(400, { error: "用户ID不能为空" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return requestEvent.json(404, { error: "用户不存在" });
    }

    userCookie.set(requestEvent, JSON.stringify(user.id));
    return requestEvent.json(200, { user });
  },
  zod$({
    userId: z.string().min(1, "用户ID不能为空"),
  })
);

export const onGet = async (requestEvent: RequestEventLoader) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
    },
    orderBy: { role: "asc" },
  });

  const cookie = userCookie.get(requestEvent);
  let currentUser: UserInfo | null = null;

  if (cookie) {
    try {
      const userId = JSON.parse(cookie);
      currentUser = users.find((u) => u.id === userId) || null;
    } catch {
      currentUser = null;
    }
  }

  if (!currentUser && users.length > 0) {
    currentUser = users[0];
    userCookie.set(requestEvent, JSON.stringify(currentUser.id));
  }

  return requestEvent.json(200, { users, currentUser });
};
