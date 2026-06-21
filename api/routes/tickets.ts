import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  approveTicket,
  rejectTicket,
  lockTicket,
  incrementPrintVersion,
  getAllUsers,
} from '../services/ticketService';
import type { CreateTicketDto, ApproveTicketDto, RejectTicketDto, UpdateTicketDto } from '../../shared/types';

const router = Router();

router.get('/tickets', (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const keyword = req.query.keyword as string | undefined;
  const tickets = getAllTickets(status, keyword);
  res.json(tickets);
});

router.get('/tickets/:id', (req: Request, res: Response) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) {
    res.status(404).json({ error: '作业票不存在' });
    return;
  }
  res.json(ticket);
});

router.post('/tickets', (req: Request, res: Response) => {
  const dto = req.body as CreateTicketDto;
  const result = createTicket(dto);
  if ('error' in result) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.status(201).json(result);
});

router.put('/tickets/:id', (req: Request, res: Response) => {
  const dto = req.body as UpdateTicketDto;
  const result = updateTicket(req.params.id, dto);
  if ('error' in result) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result);
});

router.post('/tickets/:id/approve', (req: Request, res: Response) => {
  const dto = req.body as ApproveTicketDto;
  const result = approveTicket(req.params.id, dto);
  if ('error' in result) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result);
});

router.post('/tickets/:id/reject', (req: Request, res: Response) => {
  const dto = req.body as RejectTicketDto;
  const result = rejectTicket(req.params.id, dto);
  if ('error' in result) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result);
});

router.post('/tickets/:id/lock', (req: Request, res: Response) => {
  const { userId } = req.body as { userId: string };
  const result = lockTicket(req.params.id, userId);
  if ('error' in result) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result);
});

router.post('/tickets/:id/print', (req: Request, res: Response) => {
  const result = incrementPrintVersion(req.params.id);
  if ('error' in result) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result);
});

router.get('/users', (_req: Request, res: Response) => {
  res.json(getAllUsers());
});

export default router;
