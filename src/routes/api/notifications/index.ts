import { routeLoader$, type RequestEventLoader } from "@builder.io/qwik-city";
import prisma from "~/lib/prisma";
import { userCookie, getCurrentUser } from "~/lib/auth";

export const useNotifications = routeLoader$(async (requestEvent) => {
  const cookie = userCookie.get(requestEvent);
  const currentUser = await getCurrentUser(cookie);

  if (!currentUser) {
    throw requestEvent.error(401, "未登录");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: currentUser.id },
    include: {
      inspection: {
        select: {
          id: true,
          inspectionNo: true,
          status: true,
          building: { select: { name: true } },
        },
      },
      sentBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: currentUser.id, isRead: false },
  });

  return {
    notifications,
    unreadCount,
    currentUser,
  };
});

export const onPost = async (requestEvent: RequestEventLoader) => {
  return requestEvent.json(200, { message: "Notification API" });
};
