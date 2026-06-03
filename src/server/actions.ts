"use server";

import { redirect } from "@solidjs/router";
import { z } from "zod";
import { initDB } from "./db";
import * as services from "./services";

initDB();

const createILLSchema = z.object({
  reader_card: z.string().min(1, "读者证号不能为空"),
  book_id: z.number().min(1, "请选择图书"),
  requesting_library_id: z.number().min(1, "请选择申请馆"),
  purpose: z.string().min(1, "请填写借阅用途"),
  required_date: z.string().optional()
});

export async function createILLRequestAction(formData: FormData) {
  const data = {
    reader_card: formData.get("reader_card") as string,
    book_id: Number(formData.get("book_id")),
    requesting_library_id: Number(formData.get("requesting_library_id")),
    purpose: formData.get("purpose") as string,
    required_date: formData.get("required_date") as string || undefined
  };

  const validated = createILLSchema.parse(data);
  const reader = services.findReaderByCard(validated.reader_card);
  
  if (!reader) {
    throw new Error("读者不存在");
  }

  const request = services.createILLRequest({
    reader_id: reader.id,
    book_id: validated.book_id,
    requesting_library_id: validated.requesting_library_id,
    purpose: validated.purpose,
    required_date: validated.required_date
  });

  return redirect(`/requests/${request.id}`);
}

export async function matchLibraryAction(formData: FormData) {
  const requestId = Number(formData.get("request_id"));
  const libraryId = Number(formData.get("library_id"));
  
  services.matchSupplyingLibrary(requestId, libraryId);
  return redirect(`/requests/${requestId}`);
}

export async function approveLendingAction(formData: FormData) {
  const requestId = Number(formData.get("request_id"));
  services.approveLending(requestId);
  return redirect(`/requests/${requestId}`);
}

const shipSchema = z.object({
  request_id: z.number(),
  tracking_number: z.string().min(1, "物流单号不能为空"),
  carrier: z.string().min(1, "快递公司不能为空"),
  sender_name: z.string().min(1, "寄件人不能为空"),
  sender_contact: z.string().min(1, "寄件人联系方式不能为空"),
  receiver_name: z.string().min(1, "收件人不能为空"),
  receiver_contact: z.string().min(1, "收件人联系方式不能为空"),
  send_date: z.string().min(1, "寄出日期不能为空")
});

export async function shipBookAction(formData: FormData) {
  const data = {
    request_id: Number(formData.get("request_id")),
    tracking_number: formData.get("tracking_number") as string,
    carrier: formData.get("carrier") as string,
    sender_name: formData.get("sender_name") as string,
    sender_contact: formData.get("sender_contact") as string,
    receiver_name: formData.get("receiver_name") as string,
    receiver_contact: formData.get("receiver_contact") as string,
    send_date: formData.get("send_date") as string
  };

  const validated = shipSchema.parse(data);
  
  services.shipBook(validated.request_id, {
    ill_request_id: validated.request_id,
    tracking_number: validated.tracking_number,
    carrier: validated.carrier,
    sender_name: validated.sender_name,
    sender_contact: validated.sender_contact,
    receiver_name: validated.receiver_name,
    receiver_contact: validated.receiver_contact,
    send_date: validated.send_date,
    receive_date: null,
    notes: null,
    created_at: ""
  });

  return redirect(`/requests/${validated.request_id}`);
}

export async function receiveBookAction(formData: FormData) {
  const requestId = Number(formData.get("request_id"));
  services.receiveBook(requestId);
  return redirect(`/requests/${requestId}`);
}

export async function startLendingAction(formData: FormData) {
  const requestId = Number(formData.get("request_id"));
  services.startLending(requestId);
  return redirect(`/requests/${requestId}`);
}

const renewalSchema = z.object({
  request_id: z.number(),
  requested_by: z.string().min(1, "申请人不能为空"),
  reason: z.string().min(1, "续借原因不能为空"),
  new_due_date: z.string().min(1, "新到期日期不能为空")
});

export async function createRenewalRequestAction(formData: FormData) {
  const data = {
    request_id: Number(formData.get("request_id")),
    requested_by: formData.get("requested_by") as string,
    reason: formData.get("reason") as string,
    new_due_date: formData.get("new_due_date") as string
  };

  const validated = renewalSchema.parse(data);
  
  services.createRenewalRequest({
    ill_request_id: validated.request_id,
    requested_by: validated.requested_by,
    request_date: new Date().toISOString().split("T")[0],
    reason: validated.reason,
    new_due_date: validated.new_due_date,
    status: "pending",
    approved_by: null,
    approved_date: null,
    notes: null
  });

  return redirect(`/requests/${validated.request_id}`);
}

export async function approveRenewalAction(formData: FormData) {
  const renewalId = Number(formData.get("renewal_id"));
  const approvedBy = formData.get("approved_by") as string;
  
  services.approveRenewal(renewalId, approvedBy);
  
  const renewal = services.getRenewalRequests().find(r => r.id === renewalId);
  if (renewal) {
    return redirect(`/requests/${renewal.ill_request_id}`);
  }
  return redirect("/renewals");
}

export async function rejectRenewalAction(formData: FormData) {
  const renewalId = Number(formData.get("renewal_id"));
  const approvedBy = formData.get("approved_by") as string;
  const notes = formData.get("notes") as string;
  
  services.rejectRenewal(renewalId, approvedBy, notes);
  
  const renewal = services.getRenewalRequests().find(r => r.id === renewalId);
  if (renewal) {
    return redirect(`/requests/${renewal.ill_request_id}`);
  }
  return redirect("/renewals");
}

export async function returnBookAction(formData: FormData) {
  const requestId = Number(formData.get("request_id"));
  services.returnBook(requestId);
  return redirect(`/requests/${requestId}`);
}

export async function completeRequestAction(formData: FormData) {
  const requestId = Number(formData.get("request_id"));
  services.completeRequest(requestId);
  return redirect(`/requests/${requestId}`);
}

export async function rejectRequestAction(formData: FormData) {
  const requestId = Number(formData.get("request_id"));
  const reason = formData.get("reason") as string;
  services.rejectRequest(requestId, reason);
  return redirect(`/requests/${requestId}`);
}

export async function cancelRequestAction(formData: FormData) {
  const requestId = Number(formData.get("request_id"));
  services.cancelRequest(requestId);
  return redirect(`/requests/${requestId}`);
}

const exceptionSchema = z.object({
  request_id: z.number(),
  type: z.enum(["damage", "lost", "delay", "other"]),
  description: z.string().min(1, "异常描述不能为空"),
  reported_by: z.string().min(1, "上报人不能为空")
});

export async function createExceptionAction(formData: FormData) {
  const data = {
    request_id: Number(formData.get("request_id")),
    type: formData.get("type") as "damage" | "lost" | "delay" | "other",
    description: formData.get("description") as string,
    reported_by: formData.get("reported_by") as string
  };

  const validated = exceptionSchema.parse(data);
  
  services.createException({
    ill_request_id: validated.request_id,
    type: validated.type,
    description: validated.description,
    reported_by: validated.reported_by,
    reported_at: new Date().toISOString().split("T")[0],
    resolution: null,
    resolved_at: null
  });

  return redirect(`/requests/${validated.request_id}`);
}

export async function resolveExceptionAction(formData: FormData) {
  const exceptionId = Number(formData.get("exception_id"));
  const resolution = formData.get("resolution") as string;
  
  services.resolveException(exceptionId, resolution);
  return redirect("/exceptions");
}

export async function checkOverdueAction() {
  return services.checkOverdue();
}

export async function getLibrariesAction() {
  return services.getLibraries();
}

export async function getBooksAction(libraryId?: number) {
  return services.getAvailableBooks(libraryId);
}

export async function searchBooksAction(query: string, libraryId?: number) {
  return services.searchBooks(query, libraryId);
}

export async function getILLRequestsAction(filters?: {
  status?: string;
  readerId?: number;
  libraryId?: number;
}) {
  return services.getILLRequests(filters as any);
}

export async function getILLRequestAction(id: number) {
  return services.getILLRequest(id);
}

export async function getDashboardStatsAction() {
  return services.getDashboardStats();
}

export async function getRenewalRequestsAction(illRequestId?: number) {
  return services.getRenewalRequests(illRequestId);
}

export async function getExceptionsAction(status?: string) {
  return services.getExceptions(status as any);
}

export async function getLogisticsRecordsAction(requestId: number) {
  return services.getLogisticsRecords(requestId);
}
