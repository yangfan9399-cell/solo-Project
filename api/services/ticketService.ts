import type { WorkTicket, CreateTicketDto, ApproveTicketDto, RejectTicketDto, UpdateTicketDto } from '../../shared/types';
import { initialTickets, users } from '../data/mockData';

let tickets: WorkTicket[] = JSON.parse(JSON.stringify(initialTickets));

let ticketCounter = 10;
const generateTicketNo = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const n = String(ticketCounter++).padStart(3, '0');
  return `WG-${y}-${m}${d}-${n}`;
};

const generateId = () => Math.random().toString(36).slice(2, 10);

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validateRoleDifferent(initiatorId: string, reviewerId: string): ValidationResult {
  if (initiatorId === reviewerId) {
    return { valid: false, message: '发起人和复核人不能为同一人' };
  }
  return { valid: true };
}

export function validateHighRiskIsolation(ticket: WorkTicket): ValidationResult {
  if (ticket.riskLevel === 'high') {
    const allImplemented = ticket.isolationMeasures.every((m) => m.implemented);
    if (!allImplemented || ticket.isolationMeasures.length < 2) {
      return { valid: false, message: '高风险作业票必须补齐隔离措施（至少2项且全部落实）后才能通过' };
    }
  }
  return { valid: true };
}

export function validateReviewerConfirmation(ticket: WorkTicket, dto: ApproveTicketDto): ValidationResult {
  if (!dto.towerConfirmed) return { valid: false, message: '复核人需确认塔位信息' };
  if (!dto.riskConfirmed) return { valid: false, message: '复核人需确认风险等级' };
  const allSteps = ticket.workSteps.every((s) => dto.workStepConfirmations[s.id]);
  if (!allSteps) return { valid: false, message: '复核人需逐项确认所有作业步骤' };
  const allMeasures = ticket.isolationMeasures.every((m) => dto.isolationMeasureConfirmations[m.id]);
  if (!allMeasures) return { valid: false, message: '复核人需逐项确认所有隔离措施' };
  const allTools = ticket.tools.every((t) => dto.toolConfirmations[t.id]);
  if (!allTools) return { valid: false, message: '复核人需逐项确认所有工具清单' };
  return { valid: true };
}

export function getAllTickets(status?: string, keyword?: string): WorkTicket[] {
  let result = [...tickets];
  if (status && status !== 'all') {
    result = result.filter((t) => t.status === status);
  }
  if (keyword) {
    const kw = keyword.toLowerCase();
    result = result.filter(
      (t) =>
        t.ticketNo.toLowerCase().includes(kw) ||
        t.towerPosition.toLowerCase().includes(kw) ||
        t.workDescription.toLowerCase().includes(kw) ||
        t.initiatorName.includes(kw) ||
        t.reviewerName.includes(kw)
    );
  }
  return result.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getTicketById(id: string): WorkTicket | undefined {
  return tickets.find((t) => t.id === id);
}

export function createTicket(dto: CreateTicketDto): WorkTicket | { error: string } {
  const roleCheck = validateRoleDifferent(dto.initiatorId, dto.reviewerId);
  if (!roleCheck.valid) return { error: roleCheck.message! };

  const initiator = users.find((u) => u.id === dto.initiatorId);
  const reviewer = users.find((u) => u.id === dto.reviewerId);
  if (!initiator || !reviewer) return { error: '用户不存在' };

  const now = new Date().toISOString();
  const ticket: WorkTicket = {
    id: generateId(),
    ticketNo: generateTicketNo(),
    towerPosition: dto.towerPosition,
    workDescription: dto.workDescription,
    towerConfirmedByInitiator: true,
    towerConfirmedByReviewer: false,
    workSteps: dto.workSteps.map((d) => ({
      id: generateId(),
      description: d,
      confirmedByInitiator: true,
      confirmedByReviewer: false,
    })),
    isolationMeasures: dto.isolationMeasures.map((m) => ({
      id: generateId(),
      description: m.description,
      implemented: m.implemented,
      confirmedByInitiator: true,
      confirmedByReviewer: false,
    })),
    tools: dto.tools.map((t) => ({
      id: generateId(),
      name: t.name,
      quantity: t.quantity,
      confirmedByInitiator: true,
      confirmedByReviewer: false,
    })),
    riskLevel: dto.riskLevel,
    riskConfirmedByInitiator: true,
    riskConfirmedByReviewer: false,
    initiatorId: dto.initiatorId,
    initiatorName: initiator.name,
    reviewerId: dto.reviewerId,
    reviewerName: reviewer.name,
    status: 'pending_review',
    rejectionHistory: [],
    signOffs: [{ userId: initiator.id, userName: initiator.name, timestamp: now, role: 'initiator' }],
    isLocked: false,
    printVersion: 0,
    createdAt: now,
    updatedAt: now,
  };

  const riskCheck = validateHighRiskIsolation(ticket);
  if (!riskCheck.valid) {
    ticket.status = 'high_risk_incomplete';
  }

  tickets.unshift(ticket);
  return ticket;
}

export function updateTicket(id: string, dto: UpdateTicketDto): WorkTicket | { error: string } {
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx === -1) return { error: '作业票不存在' };
  const ticket = tickets[idx];
  if (ticket.isLocked) return { error: '已锁定的作业票不能修改' };
  if (ticket.status === 'approved' || ticket.status === 'locked') {
    return { error: '该状态下不能修改' };
  }

  if (dto.initiatorId && dto.reviewerId) {
    const roleCheck = validateRoleDifferent(dto.initiatorId, dto.reviewerId);
    if (!roleCheck.valid) return { error: roleCheck.message! };
  }

  const now = new Date().toISOString();

  if (dto.towerPosition) ticket.towerPosition = dto.towerPosition;
  if (dto.workDescription) ticket.workDescription = dto.workDescription;
  if (dto.workSteps) {
    ticket.workSteps = dto.workSteps.map((d) => ({
      id: generateId(),
      description: d,
      confirmedByInitiator: true,
      confirmedByReviewer: false,
    }));
  }
  if (dto.isolationMeasures) {
    ticket.isolationMeasures = dto.isolationMeasures.map((m) => ({
      id: generateId(),
      description: m.description,
      implemented: m.implemented,
      confirmedByInitiator: true,
      confirmedByReviewer: false,
    }));
  }
  if (dto.tools) {
    ticket.tools = dto.tools.map((t) => ({
      id: generateId(),
      name: t.name,
      quantity: t.quantity,
      confirmedByInitiator: true,
      confirmedByReviewer: false,
    }));
  }
  if (dto.riskLevel) ticket.riskLevel = dto.riskLevel;
  if (dto.initiatorId) {
    const u = users.find((x) => x.id === dto.initiatorId);
    if (u) {
      ticket.initiatorId = u.id;
      ticket.initiatorName = u.name;
    }
  }
  if (dto.reviewerId) {
    const u = users.find((x) => x.id === dto.reviewerId);
    if (u) {
      ticket.reviewerId = u.id;
      ticket.reviewerName = u.name;
    }
  }

  const riskCheck = validateHighRiskIsolation(ticket);
  ticket.status = riskCheck.valid ? 'pending_review' : 'high_risk_incomplete';
  ticket.updatedAt = now;

  tickets[idx] = ticket;
  return ticket;
}

export function approveTicket(id: string, dto: ApproveTicketDto): WorkTicket | { error: string } {
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx === -1) return { error: '作业票不存在' };
  const ticket = tickets[idx];
  if (ticket.isLocked) return { error: '已锁定的作业票不能操作' };
  if (ticket.status !== 'pending_review' && ticket.status !== 'high_risk_incomplete') {
    return { error: '当前状态不能通过复核' };
  }
  if (dto.reviewerId !== ticket.reviewerId) return { error: '非指定复核人不能操作' };

  const roleCheck = validateRoleDifferent(ticket.initiatorId, dto.reviewerId);
  if (!roleCheck.valid) return { error: roleCheck.message! };

  const riskCheck = validateHighRiskIsolation(ticket);
  if (!riskCheck.valid) return { error: riskCheck.message! };

  const confCheck = validateReviewerConfirmation(ticket, dto);
  if (!confCheck.valid) return { error: confCheck.message! };

  const now = new Date().toISOString();
  ticket.towerConfirmedByReviewer = dto.towerConfirmed;
  ticket.riskConfirmedByReviewer = dto.riskConfirmed;
  ticket.workSteps.forEach((s) => {
    s.confirmedByReviewer = !!dto.workStepConfirmations[s.id];
  });
  ticket.isolationMeasures.forEach((m) => {
    m.confirmedByReviewer = !!dto.isolationMeasureConfirmations[m.id];
  });
  ticket.tools.forEach((t) => {
    t.confirmedByReviewer = !!dto.toolConfirmations[t.id];
  });
  ticket.status = 'approved';
  ticket.signOffs.push({
    userId: dto.reviewerId,
    userName: ticket.reviewerName,
    timestamp: now,
    role: 'reviewer',
  });
  ticket.updatedAt = now;

  tickets[idx] = ticket;
  return ticket;
}

export function rejectTicket(id: string, dto: RejectTicketDto): WorkTicket | { error: string } {
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx === -1) return { error: '作业票不存在' };
  const ticket = tickets[idx];
  if (ticket.isLocked) return { error: '已锁定的作业票不能操作' };
  if (ticket.status !== 'pending_review' && ticket.status !== 'high_risk_incomplete') {
    return { error: '当前状态不能驳回' };
  }
  if (dto.reviewerId !== ticket.reviewerId) return { error: '非指定复核人不能操作' };
  if (!dto.reason.trim()) return { error: '必须填写驳回原因' };

  const now = new Date().toISOString();
  ticket.status = 'rejected';
  ticket.rejectionHistory.push({
    id: generateId(),
    timestamp: now,
    rejectedBy: dto.reviewerId,
    rejectedByName: ticket.reviewerName,
    reason: dto.reason,
  });
  ticket.updatedAt = now;

  tickets[idx] = ticket;
  return ticket;
}

export function lockTicket(id: string, userId: string): WorkTicket | { error: string } {
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx === -1) return { error: '作业票不存在' };
  const ticket = tickets[idx];
  if (ticket.status !== 'approved') return { error: '只有已通过的作业票才能锁定' };

  ticket.isLocked = true;
  ticket.status = 'locked';
  ticket.updatedAt = new Date().toISOString();

  tickets[idx] = ticket;
  return ticket;
}

export function incrementPrintVersion(id: string): WorkTicket | { error: string } {
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx === -1) return { error: '作业票不存在' };
  tickets[idx].printVersion += 1;
  tickets[idx].updatedAt = new Date().toISOString();
  return tickets[idx];
}

export function getAllUsers() {
  return users;
}
