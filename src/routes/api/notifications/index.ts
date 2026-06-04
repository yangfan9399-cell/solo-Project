import { routeLoader$, type RequestEventCommon } from "@builder.io/qwik-city";
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

export const onPost = async (requestEvent: RequestEventCommon) => {
  const cookie = userCookie.get(requestEvent);
  const currentUser = await getCurrentUser(cookie);

  if (!currentUser) {
    return requestEvent.json(401, { error: "未登录" });
  }

  const formData = await requestEvent.parseBody();

  if (formData && typeof formData === "object" && "action" in formData) {
    const action = String(formData.action);

    if (action === "markAllRead") {
      await prisma.notification.updateMany({
        where: { userId: currentUser.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return requestEvent.json(200, { success: true });
    }

    if (action === "markRead" && "notificationId" in formData) {
      const notificationId = String(formData.notificationId);
      await prisma.notification.update({
        where: { id: notificationId, userId: currentUser.id },
        data: { isRead: true, readAt: new Date() },
      });
      return requestEvent.json(200, { success: true });
    }
  }

  return requestEvent.json(400, { error: "未知操作" });
};
