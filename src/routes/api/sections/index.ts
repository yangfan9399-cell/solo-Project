import { component$ } from '@builder.io/qwik';
import { routeAction$, routeLoader$, z } from '@builder.io/qwik-city';
import { sectionDao, versionDao, anomalyDetector, sampleBoxDao, anomalyDao } from '~/server/dao';

const sectionSchema = z.object({
  sampleNumber: z.string().min(1),
  mineralName: z.string().min(1),
  mineralFormula: z.string().optional(),
  crystalSystem: z.string().optional(),
  locality: z.string().optional(),
  collectionDate: z.string().optional(),
  collector: z.string().optional(),
  thinSectionNumber: z.string().min(1),
  thicknessMicrometers: z.coerce.number().min(0).max(100),
  coverSlip: z.coerce.boolean().default(true),
  mountingMedium: z.string().optional(),
  grainSizeMm: z.coerce.number().optional(),
  rockType: z.string().optional(),
  alterationDegree: z.coerce.number().optional(),
  sampleBoxId: z.coerce.number().optional(),
  boxPosition: z.string().optional(),
  notes: z.string().optional(),
});

export const useCreateSection = routeAction$(async (data, requestEvent) => {
  try {
    const validated = sectionSchema.parse(data);
    const userId = requestEvent.cookie.get('userId')?.value || 'system';
    const batchId = `batch-${Date.now()}`;

    const section = await sectionDao.create(validated, userId);

    await versionDao.create({
      sectionId: section.id,
      version: 1,
      changeType: 'create',
      changeDescription: '创建薄片记录',
      changedBy: userId,
      batchId,
    });

    const anomalies = await anomalyDetector.checkAll(section.id);
    for (const anomaly of anomalies) {
      await anomalyDao.create(anomaly as any);
    }

    if (validated.sampleBoxId && validated.boxPosition) {
      const match = validated.boxPosition.match(/^([A-Z])(\d+)$/);
      if (match) {
        const row = match[1].charCodeAt(0) - 65;
        const col = parseInt(match[2]) - 1;
        await sampleBoxDao.updateSlot(validated.sampleBoxId, row, col, { sectionId: section.id });
      }
    }

    return {
      success: true,
      id: section.id,
      message: '薄片记录创建成功',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
});

export default component$(() => null);
