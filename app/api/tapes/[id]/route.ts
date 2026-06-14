import { NextRequest, NextResponse } from 'next/server';
import { selectCleaning, spliceBreak, adjustSpeed, applyNoiseReductionAction, rollbackToHistory, recalculateTape, completeTapeRepair, getRepairHistory, getTapeDetail } from '@/lib/gameService';
import type { CleaningMethod } from '@/lib/types';

type Params = Promise<{ id: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  const { id } = await params;
  try {
    const tape = await getTapeDetail(id);
    if (!tape) {
      return NextResponse.json({ error: 'Tape not found' }, { status: 404 });
    }
    const history = tape.sessionId ? await getRepairHistory(tape.sessionId, id) : [];
    return NextResponse.json({ tape, history });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { action, ...rest } = body;
    const tapeId = id;

    switch (action) {
      case 'clean': {
        const { sessionId, method } = rest as { sessionId: string; method: CleaningMethod };
        const result = await selectCleaning(sessionId, tapeId, method);
        return NextResponse.json(result);
      }
      case 'splice': {
        const { sessionId, position } = rest as { sessionId: string; position: number };
        const result = await spliceBreak(sessionId, tapeId, position);
        return NextResponse.json(result);
      }
      case 'speed': {
        const { sessionId, speed } = rest as { sessionId: string; speed: number };
        const result = await adjustSpeed(sessionId, tapeId, speed);
        return NextResponse.json(result);
      }
      case 'noise_reduction': {
        const { sessionId, level } = rest as { sessionId: string; level: number };
        const result = await applyNoiseReductionAction(sessionId, tapeId, level);
        return NextResponse.json(result);
      }
      case 'rollback': {
        const { sessionId, historyId } = rest as { sessionId: string; historyId: string };
        const result = await rollbackToHistory(sessionId, tapeId, historyId);
        return NextResponse.json(result);
      }
      case 'recalculate': {
        const { sessionId } = rest as { sessionId: string };
        const result = await recalculateTape(sessionId, tapeId);
        return NextResponse.json(result);
      }
      case 'complete': {
        const { sessionId, cleaningMethod, repairTimeMs } = rest as {
          sessionId: string;
          cleaningMethod: CleaningMethod;
          repairTimeMs: number;
        };
        const result = await completeTapeRepair(sessionId, tapeId, cleaningMethod, repairTimeMs);
        return NextResponse.json({ result });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
