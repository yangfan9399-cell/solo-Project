import { component$ } from '@builder.io/qwik';
import { routeAction$, routeLoader$, z } from '@builder.io/qwik-city';
import {
  sectionDao,
  versionDao,
  anomalyDetector,
  sampleBoxDao,
  anomalyDao,
  micrographDao,
  opticsDao,
  associationDao,
} from '~/server/dao';
import { prepare } from '~/server/db';
import type { Micrograph, MineralOptics, Association } from '~/types/mineral';

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
  coverSlip: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true'),
  mountingMedium: z.string().optional(),
  grainSizeMm: z.coerce.number().optional(),
  rockType: z.string().optional(),
  alterationDegree: z.coerce.number().optional(),
  sampleBoxId: z.union([z.number(), z.string()]).optional().transform(v => v ? (typeof v === 'string' ? parseInt(v) : v) : undefined),
  boxPosition: z.string().optional(),
  notes: z.string().optional(),
  photos: z.array(z.object({
    mode: z.enum(['ppl', 'xpl', 'cnl']),
    magnification: z.coerce.number(),
    hasPhoto: z.boolean().optional(),
    imagePath: z.string().optional(),
    scaleBarMicrometers: z.coerce.number().optional(),
    notes: z.string().optional(),
  })).optional(),
  optics: z.object({
    relief: z.coerce.number().optional(),
    refractiveIndexMin: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v === undefined || v === null ? undefined : Number(v)),
    refractiveIndexMax: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v === undefined || v === null ? undefined : Number(v)),
    birefringence: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v === undefined || v === null ? undefined : Number(v)),
    opticSign: z.enum(['positive', 'negative', 'unknown']).optional(),
    opticAxisAngle: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v === undefined || v === null ? undefined : Number(v)),
    extinctionType: z.string().optional(),
    extinctionAngle: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v === undefined || v === null ? undefined : Number(v)),
    pleochroism: z.string().optional(),
    pleochroismColors: z.string().optional(),
    absorptionFormula: z.string().optional(),
    twinningType: z.string().optional(),
    twinningDescription: z.string().optional(),
    zoning: z.union([z.coerce.number(), z.string()]).optional().transform(v => {
      if (v === undefined || v === null || v === '') return 0;
      return Number(v);
    }),
    inclusionsDescription: z.string().optional(),
  }).optional(),
  associations: z.array(z.object({
    associatedMineral: z.string().optional(),
    relationshipType: z.string().optional(),
    texturalRelation: z.string().optional(),
    abundancePercent: z.coerce.number().optional(),
    grainSizeMm: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v === undefined || v === null ? undefined : Number(v)),
    parageneticStage: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
});

const updateSchema = sectionSchema.partial().extend({ id: z.coerce.number() });

export const useCreateSection = routeAction$(async (data, requestEvent) => {
  try {
    const validated = sectionSchema.parse(data);
    const userId = requestEvent.cookie.get('userId')?.value || 'system';
    const batchId = `batch-${Date.now()}`;

    const section = await sectionDao.create(validated, userId);

    if (validated.photos) {
      for (const photo of validated.photos) {
        if (photo.hasPhoto || photo.imagePath) {
          const micrographData: Omit<Micrograph, 'id'> = {
            sectionId: section.id,
            mode: photo.mode,
            magnification: photo.magnification,
            scaleBarMicrometers: photo.scaleBarMicrometers || 100,
            imagePath: photo.imagePath || `/images/placeholder-${photo.mode}-${photo.magnification}.svg`,
            notes: photo.notes,
          };
          await micrographDao.create(micrographData);
        }
      }
    }

    if (validated.optics) {
      const opticsData = {
        sectionId: section.id,
        relief: validated.optics.relief ?? 0,
        refractiveIndexMin: validated.optics.refractiveIndexMin,
        refractiveIndexMax: validated.optics.refractiveIndexMax,
        birefringence: validated.optics.birefringence,
        opticSign: validated.optics.opticSign || 'unknown',
        opticAxisAngle: validated.optics.opticAxisAngle,
        extinctionType: validated.optics.extinctionType || undefined,
        extinctionAngle: validated.optics.extinctionAngle,
        pleochroism: validated.optics.pleochroism || '',
        pleochroismColors: validated.optics.pleochroismColors || '',
        absorptionFormula: validated.optics.absorptionFormula || '',
        twinningType: validated.optics.twinningType || undefined,
        twinningDescription: validated.optics.twinningDescription || '',
        zoning: validated.optics.zoning ?? 0,
        inclusionsDescription: validated.optics.inclusionsDescription || '',
      } as Omit<MineralOptics, 'id'>;
      await opticsDao.save(opticsData);
    }

    if (validated.associations) {
      for (const assoc of validated.associations) {
        if (assoc.associatedMineral) {
          const assocData: Omit<Association, 'id'> = {
            sectionId: section.id,
            associatedMineral: assoc.associatedMineral || '',
            relationshipType: assoc.relationshipType || '共生',
            texturalRelation: assoc.texturalRelation || '',
            abundancePercent: assoc.abundancePercent ?? 0,
            grainSizeMm: assoc.grainSizeMm,
            parageneticStage: assoc.parageneticStage || '',
            notes: assoc.notes || '',
          };
          await associationDao.create(assocData);
        }
      }
    }

    await versionDao.create({
      sectionId: section.id,
      version: 1,
      changeType: 'create',
      changeDescription: `创建薄片记录${validated.photos ? `，包含 ${validated.photos.filter(p => p.hasPhoto).length} 张显微照片` : ''}${validated.optics ? '，光学性质' : ''}${validated.associations ? `，${validated.associations.filter(a => a.associatedMineral).length} 种伴生矿物` : ''}`,
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
    console.error('创建薄片失败:', error);
    return {
      success: false,
      error: error.message || '创建失败',
    };
  }
});

export const useUpdateSection = routeAction$(async (data, requestEvent) => {
  try {
    const validated = updateSchema.parse(data);
    const userId = requestEvent.cookie.get('userId')?.value || 'system';
    const sectionId = validated.id;
    const batchId = `batch-${Date.now()}`;
    const existing = await sectionDao.getById(sectionId);
    if (!existing) {
      return { success: false, error: '记录不存在' };
    }

    const { id, ...updateData } = validated;

    const baseFieldMap: Partial<Record<string, string>> = {
      sampleNumber: '样本编号', mineralName: '矿物名称', mineralFormula: '化学式',
      crystalSystem: '晶系', locality: '产地', collectionDate: '采集日期',
      collector: '采集者', thinSectionNumber: '薄片编号',
      thicknessMicrometers: '薄片厚度', coverSlip: '盖玻片', mountingMedium: '封固剂',
      grainSizeMm: '颗粒尺寸', rockType: '岩石类型', alterationDegree: '蚀变程度',
      sampleBoxId: '样本盒', boxPosition: '盒内位置', notes: '备注',
    };

    const baseChanges: string[] = [];
    const baseSetClauses: string[] = [];
    const baseParams: any[] = [];
    const fieldMap: Record<string, string> = {
      sampleNumber: 'sample_number', mineralName: 'mineral_name', mineralFormula: 'mineral_formula',
      crystalSystem: 'crystal_system', locality: 'locality', collectionDate: 'collection_date',
      collector: 'collector', thinSectionNumber: 'thin_section_number',
      thicknessMicrometers: 'thickness_micrometers', coverSlip: 'cover_slip', mountingMedium: 'mounting_medium',
      grainSizeMm: 'grain_size_mm', rockType: 'rock_type', alterationDegree: 'alteration_degree',
      sampleBoxId: 'sample_box_id', boxPosition: 'box_position', notes: 'notes',
    };

    for (const [key, value] of Object.entries(updateData)) {
      if (['photos', 'optics', 'associations'].includes(key)) continue;
      const dbField = fieldMap[key];
      if (!dbField) continue;
      const oldVal = (existing as any)[key];
      const newVal = typeof value === 'boolean' ? (value ? 1 : 0) : value;
      if (String(oldVal) !== String(newVal)) {
        baseSetClauses.push(`${dbField} = ?`);
        baseParams.push(newVal);
        baseChanges.push(`${baseFieldMap[key] || key}: ${oldVal} → ${newVal}`);
      }
    }

    let hasRelatedChanges = false;
    const changeDescriptions: string[] = [];

    if (baseChanges.length > 0) {
      changeDescriptions.push(`基本信息更新: ${baseChanges.length} 项`);
    }

    if (validated.photos) {
      const existingPhotos = await micrographDao.listBySection(sectionId);
      const newValidPhotos = validated.photos.filter(p => p.hasPhoto || p.imagePath);
      if (existingPhotos.length !== newValidPhotos.length) {
        hasRelatedChanges = true;
        changeDescriptions.push(`显微照片: ${existingPhotos.length}张 → ${newValidPhotos.length}张`);
      } else if (existingPhotos.length > 0) {
        const sortedExisting = [...existingPhotos].sort((a, b) =>
          `${a.mode}-${a.magnification}`.localeCompare(`${b.mode}-${b.magnification}`)
        );
        const sortedNew = [...newValidPhotos].sort((a, b) =>
          `${a.mode}-${a.magnification}`.localeCompare(`${b.mode}-${b.magnification}`)
        );
        const photoChangedFields: string[] = [];
        for (let i = 0; i < sortedExisting.length; i++) {
          const oldP = sortedExisting[i];
          const newP = sortedNew[i];
          if (!newP) { photoChangedFields.push('count'); break; }
          const fieldsToCheck = ['imagePath', 'scaleBarMicrometers', 'notes'];
          for (const field of fieldsToCheck) {
            const ov = String((oldP as any)[field] ?? '');
            const nv = String((newP as any)[field] ?? '');
            if (ov !== nv && !photoChangedFields.includes(field)) {
              photoChangedFields.push(field);
            }
          }
        }
        if (photoChangedFields.length > 0) {
          hasRelatedChanges = true;
          changeDescriptions.push(`显微照片更新: ${photoChangedFields.join(', ')}`);
        }
      }
      for (const ep of existingPhotos) {
        await micrographDao.delete(ep.id);
      }
      for (const photo of newValidPhotos) {
        const micrographData: Omit<Micrograph, 'id'> = {
          sectionId, mode: photo.mode, magnification: photo.magnification,
          scaleBarMicrometers: photo.scaleBarMicrometers || 100,
          imagePath: photo.imagePath || `/images/placeholder-${photo.mode}-${photo.magnification}.svg`,
          notes: photo.notes,
        };
        await micrographDao.create(micrographData);
      }
    }

    if (validated.optics) {
      const existingOptics = await opticsDao.getBySection(sectionId);
      const opticsData = {
        sectionId,
        relief: validated.optics.relief ?? 0,
        refractiveIndexMin: validated.optics.refractiveIndexMin,
        refractiveIndexMax: validated.optics.refractiveIndexMax,
        birefringence: validated.optics.birefringence,
        opticSign: validated.optics.opticSign || 'unknown',
        opticAxisAngle: validated.optics.opticAxisAngle,
        extinctionType: validated.optics.extinctionType || undefined,
        extinctionAngle: validated.optics.extinctionAngle,
        pleochroism: validated.optics.pleochroism || '',
        pleochroismColors: validated.optics.pleochroismColors || '',
        absorptionFormula: validated.optics.absorptionFormula || '',
        twinningType: validated.optics.twinningType || undefined,
        twinningDescription: validated.optics.twinningDescription || '',
        zoning: validated.optics.zoning ?? 0,
        inclusionsDescription: validated.optics.inclusionsDescription || '',
      } as Omit<MineralOptics, 'id'>;

      if (!existingOptics) {
        hasRelatedChanges = true;
        changeDescriptions.push('光学性质: 新增');
      } else {
        const opticsFieldMap: Record<string, string> = {
          relief: '突起', refractiveIndexMin: '最小折射率', refractiveIndexMax: '最大折射率',
          birefringence: '双折射率', opticSign: '光性符号', opticAxisAngle: '光轴角',
          extinctionType: '消光类型', extinctionAngle: '消光角',
          pleochroism: '多色性', pleochroismColors: '多色性颜色', absorptionFormula: '吸收公式',
          twinningType: '双晶类型', twinningDescription: '双晶描述',
          zoning: '环带', inclusionsDescription: '包裹体描述',
        };
        const fieldsChanged = Object.keys(opticsFieldMap).filter(k => {
          const oldVal = (existingOptics as any)[k];
          const newVal = (opticsData as any)[k];
          return String(oldVal) !== String(newVal);
        });
        if (fieldsChanged.length > 0) {
          hasRelatedChanges = true;
          const labeled = fieldsChanged.map(f => opticsFieldMap[f] || f);
          changeDescriptions.push(`光学性质更新: ${labeled.join(', ')}`);
        }
      }
      await opticsDao.save(opticsData);
    }

    if (validated.associations) {
      const existingAssocs = await associationDao.listBySection(sectionId);
      const newValidAssocs = validated.associations.filter(a => a.associatedMineral);

      if (existingAssocs.length !== newValidAssocs.length) {
        hasRelatedChanges = true;
        changeDescriptions.push(`伴生矿物: ${existingAssocs.length}种 → ${newValidAssocs.length}种`);
      } else if (existingAssocs.length > 0) {
        const sortedExisting = [...existingAssocs].sort((a, b) =>
          (a.associatedMineral || '').localeCompare(b.associatedMineral || '')
        );
        const sortedNew = [...newValidAssocs].sort((a, b) =>
          (a.associatedMineral || '').localeCompare(b.associatedMineral || '')
        );

        const assocFieldMap: Record<string, string> = {
          associatedMineral: '伴生矿物', relationshipType: '关系类型', texturalRelation: '结构关系',
          abundancePercent: '含量%', grainSizeMm: '粒度mm', parageneticStage: '共生阶段', notes: '备注',
        };
        const changedFields: string[] = [];
        for (let i = 0; i < sortedExisting.length; i++) {
          const oldA = sortedExisting[i];
          const newA = sortedNew[i];
          if (!newA) { changedFields.push('count'); break; }
          const newAData: Omit<Association, 'id'> = {
            sectionId,
            associatedMineral: newA.associatedMineral || '',
            relationshipType: newA.relationshipType || '共生',
            texturalRelation: newA.texturalRelation || '',
            abundancePercent: newA.abundancePercent ?? 0,
            grainSizeMm: newA.grainSizeMm,
            parageneticStage: newA.parageneticStage || '',
            notes: newA.notes || '',
          };
          for (const field of Object.keys(assocFieldMap)) {
            const oldVal = String((oldA as any)[field] ?? '');
            const newVal = String((newAData as any)[field] ?? '');
            if (oldVal !== newVal && !changedFields.includes(field)) {
              changedFields.push(field);
            }
          }
        }

        if (changedFields.length > 0) {
          hasRelatedChanges = true;
          const labeled = changedFields.map(f => assocFieldMap[f] || f);
          changeDescriptions.push(`伴生关系更新: ${labeled.join(', ')}`);
        }
      }

      for (const ea of existingAssocs) {
        await associationDao.delete(ea.id);
      }
      for (const assoc of newValidAssocs) {
        const assocData: Omit<Association, 'id'> = {
          sectionId,
          associatedMineral: assoc.associatedMineral || '',
          relationshipType: assoc.relationshipType || '共生',
          texturalRelation: assoc.texturalRelation || '',
          abundancePercent: assoc.abundancePercent ?? 0,
          grainSizeMm: assoc.grainSizeMm,
          parageneticStage: assoc.parageneticStage || '',
          notes: assoc.notes || '',
        };
        await associationDao.create(assocData);
      }
    }

    const shouldBumpVersion = baseChanges.length > 0 || hasRelatedChanges;
    const newVersion = existing.currentVersion + 1;

    if (baseSetClauses.length > 0) {
      baseSetClauses.push('updated_at = CURRENT_TIMESTAMP');
      if (shouldBumpVersion) {
        baseSetClauses.push('current_version = current_version + 1');
      }
      baseParams.push(sectionId);
      const sql = `UPDATE thin_sections SET ${baseSetClauses.join(', ')} WHERE id = ?`;
      const updateStmt = await prepare(sql);
      updateStmt.run(baseParams);
    } else if (shouldBumpVersion) {
      const bumpStmt = await prepare(
        'UPDATE thin_sections SET current_version = current_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      );
      bumpStmt.run([sectionId]);
    }

    const finalVersion = shouldBumpVersion ? newVersion : existing.currentVersion;

    if (shouldBumpVersion) {
      const finalDesc = changeDescriptions.length > 0
        ? changeDescriptions.join('；')
        : '更新薄片记录';

      await versionDao.create({
        sectionId,
        changeType: 'update',
        version: finalVersion,
        changeDescription: finalDesc,
        changedBy: userId,
        batchId,
      });
    }

    await anomalyDetector.checkAll(sectionId);

    return {
      success: true,
      id: sectionId,
      message: '保存成功',
      version: finalVersion,
    };
  } catch (error: any) {
    console.error('更新薄片失败:', error);
    return {
      success: false,
      error: error.message || '保存失败',
    };
  }
});

export default component$(() => null);
