import { cookies } from "next/headers";
import { UserRole, type CurrentUser } from "./types";

export const MOCK_USERS: CurrentUser[] = [
  { id: "user-op-001", name: "李经办", role: UserRole.OPERATOR },
  { id: "user-op-002", name: "王经办", role: UserRole.OPERATOR },
  { id: "user-rv-001", name: "张复核", role: UserRole.REVIEWER },
  { id: "user-admin-001", name: "赵管理员", role: UserRole.ADMIN },
];

export async function getCurrentUser(): Promise<CurrentUser> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("currentUserId")?.value;
    if (userId) {
      const found = MOCK_USERS.find((u) => u.id === userId);
      if (found) return found;
    }
  } catch (e) {
    // 忽略 cookies 读取错误
  }
  return MOCK_USERS[0];
}

export async function setCurrentUser(userId: string): Promise<CurrentUser> {
  const cookieStore = await cookies();
  const found = MOCK_USERS.find((u) => u.id === userId);
  if (found) {
    cookieStore.set("currentUserId", userId, { path: "/" });
    return found;
  }
  throw new Error("用户不存在");
}

export async function getOperatorUsers() {
  return MOCK_USERS.filter((u) => u.role === UserRole.OPERATOR);
}

export async function getReviewerUsers() {
  return MOCK_USERS.filter((u) => u.role === UserRole.REVIEWER);
}

export async function getAllUsers() {
  return MOCK_USERS;
}

export function canEditOrder(
  user: CurrentUser,
  status: string,
  isArchived: boolean
): boolean {
  if (isArchived) return false;
  if (user.role === UserRole.ADMIN) return true;
  if (user.role === UserRole.OPERATOR) {
    return ["PENDING_ACCEPT", "PROCESSING", "REVIEW_REJECTED"].includes(status);
  }
  if (user.role === UserRole.REVIEWER) {
    return status === "PENDING_REVIEW";
  }
  return false;
}

export function canSupplementMaterials(
  user: CurrentUser,
  status: string,
  isArchived: boolean
): boolean {
  if (isArchived) return false;
  return (
    user.role === UserRole.OPERATOR &&
    ["PROCESSING", "REVIEW_REJECTED"].includes(status)
  );
}

export function canReview(
  user: CurrentUser,
  status: string,
  isArchived: boolean
): boolean {
  if (isArchived) return false;
  return user.role === UserRole.REVIEWER && status === "PENDING_REVIEW";
}

export function canArchive(
  user: CurrentUser,
  status: string,
  isArchived: boolean
): boolean {
  if (isArchived) return false;
  return (
    (user.role === UserRole.REVIEWER || user.role === UserRole.ADMIN) &&
    status === "REVIEW_APPROVED"
  );
}

export function canReopen(
  user: CurrentUser,
  status: string,
  isArchived: boolean
): boolean {
  return (
    user.role === UserRole.ADMIN &&
    isArchived &&
    status === "ARCHIVED"
  );
}
