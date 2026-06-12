import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OrderStatus } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(
  date: Date | string | null | undefined
): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDecimal(
  value: number | string | null | undefined | { toNumber?: () => number }
): string {
  if (value === null || value === undefined) return "-";
  let num: number;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    num = (value as { toNumber: () => number }).toNumber();
  } else if (typeof value === "string") {
    num = parseFloat(value);
  } else {
    num = value as number;
  }
  return num.toFixed(2);
}

export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    PENDING_ACCEPT: "bg-status-pending text-white",
    PROCESSING: "bg-status-processing text-white",
    PENDING_REVIEW: "bg-status-reviewing text-white",
    REVIEW_APPROVED: "bg-status-approved text-white",
    REVIEW_REJECTED: "bg-status-rejected text-white",
    ARCHIVED: "bg-status-archived text-white",
  };
  return colors[status];
}

export function getStatusBgColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    PENDING_ACCEPT: "bg-amber-50 border-amber-200",
    PROCESSING: "bg-blue-50 border-blue-200",
    PENDING_REVIEW: "bg-purple-50 border-purple-200",
    REVIEW_APPROVED: "bg-green-50 border-green-200",
    REVIEW_REJECTED: "bg-red-50 border-red-200",
    ARCHIVED: "bg-gray-50 border-gray-200",
  };
  return colors[status];
}

export function generateOrderNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `SLUICE-${year}${month}${day}-${random}`;
}

export function getMonthKey(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
