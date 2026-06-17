import { prepare, getDb, exec } from './db';
import type {
  SectionType,
  SectionListItem,
  SectionDetail,
  Micrograph,
  MineralOptics,
  InterferenceColor,
  Cleavage,
  Association,
  SampleBox,
  BoxSlot,
  VersionHistory,
  DataAnomaly,
} from '~/types/mineral';

function rowToSection(row: any): SectionType {
  return {
    id: row.id,
    sampleNumber: row.sample_number,
    mineralName: row.mineral_name,
    mineralFormula: row.mineral_formula,
    crystalSystem: row.crystal_system,
    locality: row.locality,
    collectionDate: row.collection_date,
    collector: row.collector,
    thinSectionNumber: row.thin_section_number,
    thicknessMicrometers: row.thickness_micrometers,
    coverSlip: row.cover_slip === 1,
    mountingMedium: row.mounting_medium,
    grainSizeMm: row.grain_size_mm,
    rockType: row.rock_type,
    alterationDegree: row.alteration_degree,
    sampleBoxId: row.sample_box_id,
    boxPosition: row.box_position,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    currentVersion: row.current_version,
    isDeleted: row.is_deleted,
  };
}

function rowToMicrograph(row: any): Micrograph {
  return {
    id: row.id,
    sectionId: row.section_id,
    mode: row.mode,
    magnification: row.magnification,
    scaleBarMicrometers: row.scale_bar_micrometers,
    imagePath: row.image_path,
    analyzerAngle: row.analyzer_angle,
    accessoryPlate: row.accessory_plate,
    exposureMs: row.exposure_ms,
    notes: row.notes,
    capturedAt: row.captured_at,
    capturedBy: row.captured_by,
  };
}

function rowToOptics(row: any): MineralOptics {
  return {
    id: row.id,
    sectionId: row.section_id,
    relief: row.relief,
    refractiveIndexMin: row.refractive_index_min,
    refractiveIndexMax: row.refractive_index_max,
    birefringence: row.birefringence,
    opticSign: row.optic_sign,
    opticAxisAngle: row.optic_axis_angle,
    extinctionType: row.extinction_type,
    extinctionAngle: row.extinction_angle,
    pleochroism: row.pleochroism,
    pleochroismColors: row.pleochroism_colors,
    absorptionFormula: row.absorption_formula,
    twinningType: row.twinning_type,
    twinningDescription: row.twinning_description,
    zoning: row.zoning,
    inclusionsDescription: row.inclusions_description,
  };
}

function rowToInterferenceColor(row: any): InterferenceColor {
  return {
    id: row.id,
    sectionId: row.section_id,
    mineralGrainId: row.mineral_grain_id,
    order: row.order,
    colorName: row.color_name,
    colorHex: row.color_hex,
    estimatedBirefringence: row.estimated_birefringence,
    thicknessMicrometers: row.thickness_micrometers,
    grainOrientation: row.grain_orientation,
    isAnomalous: row.is_anomalous,
    anomalousDescription: row.anomalous_description,
    accessoryPlateUsed: row.accessory_plate_used,
    notes: row.notes,
  };
}

function rowToCleavage(row: any): Cleavage {
  return {
    id: row.id,
    sectionId: row.section_id,
    mineralGrainId: row.mineral_grain_id,
    quality: row.quality,
    numberOfDirections: row.number_of_directions,
    angleBetweenDirections: row.angle_between_directions,
    cleavageTrace: row.cleavage_trace,
    partingDescription: row.parting_description,
    fractureType: row.fracture_type,
    notes: row.notes,
  };
}

function rowToAssociation(row: any): Association {
  return {
    id: row.id,
    sectionId: row.section_id,
    associatedMineral: row.associated_mineral,
    relationshipType: row.relationship_type,
    texturalRelation: row.textural_relation,
    abundancePercent: row.abundance_percent,
    grainSizeMm: row.grain_size_mm,
    parageneticStage: row.paragenetic_stage,
    notes: row.notes,
  };
}

function rowToSampleBox(row: any): SampleBox {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    rows: row.rows,
    columns: row.columns,
    location: row.location,
    description: row.description,
    createdAt: row.created_at,
  };
}

function rowToVersionHistory(row: any): VersionHistory {
  return {
    id: row.id,
    sectionId: row.section_id,
    version: row.version,
    changeType: row.change_type,
    fieldName: row.field_name,
    oldValue: row.old_value,
    newValue: row.new_value,
    changeDescription: row.change_description,
    changedBy: row.changed_by,
    changedAt: row.changed_at,
    batchId: row.batch_id,
  };
}

function rowToAnomaly(row: any): DataAnomaly {
  return {
    id: row.id,
    sectionId: row.section_id,
    anomalyType: row.anomaly_type,
    severity: row.severity,
    fieldName: row.field_name,
    currentValue: row.current_value,
    expectedRange: row.expected_range,
    description: row.description,
    detectedAt: row.detected_at,
    resolvedAt: row.resolved_at,
    resolverNote: row.resolver_note,
  };
}

async function lastInsertId(): Promise<number> {
  const stmt = await prepare('SELECT last_insert_rowid() as id');
  const row = stmt.get();
  return row?.id || 0;
}

async function changesCount(): Promise<number> {
  const stmt = await prepare('SELECT changes() as cnt');
  const row = stmt.get();
  return row?.cnt || 0;
}

export interface SectionFilter {
  mineralName?: string;
  locality?: string;
  boxId?: number;
  hasAnomalies?: boolean;
  dateFrom?: string;
  dateTo?: string;
  crystalSystem?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const sectionDao = {
  async list(filter: SectionFilter = {}): Promise<SectionListItem[]> {
    const where: string[] = ['ts.is_deleted = 0'];
    const params: any[] = [];

    if (filter.mineralName) {
      where.push('ts.mineral_name LIKE ?');
      params.push(`%${filter.mineralName}%`);
    }
    if (filter.locality) {
      where.push('ts.locality LIKE ?');
      params.push(`%${filter.locality}%`);
    }
    if (filter.boxId) {
      where.push('ts.sample_box_id = ?');
      params.push(filter.boxId);
    }
    if (filter.hasAnomalies) {
      where.push('EXISTS (SELECT 1 FROM data_anomalies da WHERE da.section_id = ts.id AND da.resolved_at IS NULL)');
    }
    if (filter.dateFrom) {
      where.push('ts.created_at >= ?');
      params.push(filter.dateFrom);
    }
    if (filter.dateTo) {
      where.push('ts.created_at <= ?');
      params.push(filter.dateTo);
    }
    if (filter.crystalSystem) {
      where.push('ts.crystal_system = ?');
      params.push(filter.crystalSystem);
    }
    if (filter.search) {
      where.push('(ts.mineral_name LIKE ? OR ts.sample_number LIKE ? OR ts.thin_section_number LIKE ? OR ts.notes LIKE ?)');
      const searchTerm = `%${filter.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const page = filter.page || 1;
    const pageSize = filter.pageSize || 50;
    const offset = (page - 1) * pageSize;

    const sql = `
      SELECT ts.*,
             sb.name as box_name,
             (SELECT COUNT(*) FROM micrographs m WHERE m.section_id = ts.id) as micrograph_count,
             (SELECT COUNT(*) FROM interference_colors ic WHERE ic.section_id = ts.id) as interference_color_count,
             (SELECT COUNT(*) FROM associations a WHERE a.section_id = ts.id) as association_count,
             (SELECT COUNT(*) FROM data_anomalies da WHERE da.section_id = ts.id AND da.resolved_at IS NULL) as anomaly_count,
             (SELECT MAX(changed_at) FROM version_history vh WHERE vh.section_id = ts.id) as latest_version_at
      FROM thin_sections ts
      LEFT JOIN sample_boxes sb ON sb.id = ts.sample_box_id
      ${whereClause}
      ORDER BY ts.updated_at DESC
      LIMIT ? OFFSET ?
    `;

    const stmt = await prepare(sql);
    const rows = stmt.all([...params, pageSize, offset]);
    return rows.map((row: any) => ({
      ...rowToSection(row),
      micrographCount: row.micrograph_count,
      interferenceColorCount: row.interference_color_count,
      associationCount: row.association_count,
      anomalyCount: row.anomaly_count,
      latestVersionAt: row.latest_version_at,
      boxName: row.box_name,
    }));
  },

  async count(filter: SectionFilter = {}): Promise<number> {
    const where: string[] = ['is_deleted = 0'];
    const params: any[] = [];

    if (filter.mineralName) {
      where.push('mineral_name LIKE ?');
      params.push(`%${filter.mineralName}%`);
    }
    if (filter.locality) {
      where.push('locality LIKE ?');
      params.push(`%${filter.locality}%`);
    }
    if (filter.boxId) {
      where.push('sample_box_id = ?');
      params.push(filter.boxId);
    }
    if (filter.hasAnomalies) {
      where.push('EXISTS (SELECT 1 FROM data_anomalies da WHERE da.section_id = thin_sections.id AND da.resolved_at IS NULL)');
    }
    if (filter.dateFrom) {
      where.push('created_at >= ?');
      params.push(filter.dateFrom);
    }
    if (filter.dateTo) {
      where.push('created_at <= ?');
      params.push(filter.dateTo);
    }
    if (filter.crystalSystem) {
      where.push('crystal_system = ?');
      params.push(filter.crystalSystem);
    }
    if (filter.search) {
      where.push('(mineral_name LIKE ? OR sample_number LIKE ? OR thin_section_number LIKE ? OR notes LIKE ?)');
      const searchTerm = `%${filter.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const stmt = await prepare(`SELECT COUNT(*) as cnt FROM thin_sections ${whereClause}`);
    const row = stmt.get(params) as any;
    return row?.cnt || 0;
  },

  async getById(id: number): Promise<SectionDetail | null> {
    const sectionStmt = await prepare('SELECT * FROM thin_sections WHERE id = ? AND is_deleted = 0');
    const sectionRow = sectionStmt.get([id]) as any;
    if (!sectionRow) return null;

    const micrographStmt = await prepare('SELECT * FROM micrographs WHERE section_id = ? ORDER BY mode, magnification');
    const micrographRows = micrographStmt.all([id]);

    const opticsStmt = await prepare('SELECT * FROM mineral_optics WHERE section_id = ?');
    const opticsRow = opticsStmt.get([id]);

    const icStmt = await prepare('SELECT * FROM interference_colors WHERE section_id = ?');
    const icRows = icStmt.all([id]);

    const cleavageStmt = await prepare('SELECT * FROM cleavages WHERE section_id = ?');
    const cleavageRows = cleavageStmt.all([id]);

    const assocStmt = await prepare('SELECT * FROM associations WHERE section_id = ? ORDER BY abundance_percent DESC');
    const assocRows = assocStmt.all([id]);

    const vhStmt = await prepare('SELECT * FROM version_history WHERE section_id = ? ORDER BY version DESC, changed_at DESC');
    const vhRows = vhStmt.all([id]);

    const anomalyStmt = await prepare('SELECT * FROM data_anomalies WHERE section_id = ? ORDER BY severity DESC, detected_at DESC');
    const anomalyRows = anomalyStmt.all([id]);

    let box = undefined;
    if (sectionRow.sample_box_id) {
      const boxStmt = await prepare('SELECT * FROM sample_boxes WHERE id = ?');
      const boxRow = boxStmt.get([sectionRow.sample_box_id]);
      if (boxRow) {
        box = {
          ...rowToSampleBox(boxRow),
          position: sectionRow.box_position,
        };
      }
    }

    return {
      ...rowToSection(sectionRow),
      micrographs: micrographRows.map(rowToMicrograph),
      optics: opticsRow ? rowToOptics(opticsRow) : undefined,
      interferenceColors: icRows.map(rowToInterferenceColor),
      cleavages: cleavageRows.map(rowToCleavage),
      associations: assocRows.map(rowToAssociation),
      versionHistory: vhRows.map(rowToVersionHistory),
      anomalies: anomalyRows.map(rowToAnomaly),
      box,
    };
  },

  async create(data: Partial<SectionType>, userId?: string): Promise<SectionType> {
    const stmt = await prepare(`
      INSERT INTO thin_sections (
        sample_number, mineral_name, mineral_formula, crystal_system, locality,
        collection_date, collector, thin_section_number, thickness_micrometers,
        cover_slip, mounting_medium, grain_size_mm, rock_type, alteration_degree,
        sample_box_id, box_position, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      data.sampleNumber || '',
      data.mineralName || '',
      data.mineralFormula || null,
      data.crystalSystem || null,
      data.locality || null,
      data.collectionDate || null,
      data.collector || null,
      data.thinSectionNumber || '',
      data.thicknessMicrometers || 30,
      data.coverSlip ? 1 : 0,
      data.mountingMedium || null,
      data.grainSizeMm || null,
      data.rockType || null,
      data.alterationDegree || 0,
      data.sampleBoxId || null,
      data.boxPosition || null,
      data.notes || null,
    ]);

    const id = await lastInsertId();
    const section = await this.getById(id) as SectionDetail;

    await versionDao.create({
      sectionId: section.id,
      version: 1,
      changeType: 'create',
      changeDescription: '创建薄片记录',
      changedBy: userId,
    });

    await anomalyDetector.checkAll(section.id);

    return section;
  },

  async update(id: number, data: Partial<SectionType>, userId?: string): Promise<SectionType> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('记录不存在');

    const fields: string[] = [];
    const params: any[] = [];
    const changes: { field: string; old: any; new: any }[] = [];

    const fieldMap: Partial<Record<keyof SectionType, string>> = {
      sampleNumber: 'sample_number',
      mineralName: 'mineral_name',
      mineralFormula: 'mineral_formula',
      crystalSystem: 'crystal_system',
      locality: 'locality',
      collectionDate: 'collection_date',
      collector: 'collector',
      thinSectionNumber: 'thin_section_number',
      thicknessMicrometers: 'thickness_micrometers',
      coverSlip: 'cover_slip',
      mountingMedium: 'mounting_medium',
      grainSizeMm: 'grain_size_mm',
      rockType: 'rock_type',
      alterationDegree: 'alteration_degree',
      sampleBoxId: 'sample_box_id',
      boxPosition: 'box_position',
      notes: 'notes',
    };

    for (const [key, value] of Object.entries(data)) {
      const dbField = fieldMap[key as keyof SectionType];
      if (!dbField) continue;

      const oldValue = (existing as any)[key];
      const newValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;

      if (oldValue !== newValue) {
        fields.push(`${dbField} = ?`);
        params.push(newValue);
        changes.push({ field: key, old: oldValue, new: value });
      }
    }

    if (fields.length === 0) return existing;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    fields.push('current_version = current_version + 1');
    params.push(id);

    const sql = `UPDATE thin_sections SET ${fields.join(', ')} WHERE id = ?`;
    const updateStmt = await prepare(sql);
    updateStmt.run(params);

    const newVersion = existing.currentVersion + 1;

    for (const change of changes) {
      await versionDao.create({
        sectionId: id,
        version: newVersion,
        changeType: 'update',
        fieldName: change.field,
        oldValue: change.old?.toString(),
        newValue: change.new?.toString(),
        changeDescription: `更新 ${change.field}: ${change.old} → ${change.new}`,
        changedBy: userId,
      });
    }

    if (changes.length > 1) {
      await versionDao.create({
        sectionId: id,
        version: newVersion,
        changeType: 'update',
        changeDescription: `批量更新 ${changes.length} 个字段`,
        changedBy: userId,
      });
    }

    await anomalyDetector.checkAll(id);

    return (await this.getById(id))!;
  },

  async delete(id: number, userId?: string): Promise<boolean> {
    const stmt = await prepare('UPDATE thin_sections SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run([id]);
    const changed = await changesCount();
    if (changed > 0) {
      const existing = await this.getById(id);
      await versionDao.create({
        sectionId: id,
        version: (existing?.currentVersion || 1) + 1,
        changeType: 'update',
        changeDescription: '标记删除',
        changedBy: userId,
      });
    }
    return changed > 0;
  },

  async getDistinctMinerals(): Promise<string[]> {
    const stmt = await prepare('SELECT DISTINCT mineral_name FROM thin_sections WHERE is_deleted = 0 ORDER BY mineral_name');
    const rows = stmt.all() as any[];
    return rows.map(r => r.mineral_name).filter(Boolean);
  },

  async getDistinctLocalities(): Promise<string[]> {
    const stmt = await prepare('SELECT DISTINCT locality FROM thin_sections WHERE is_deleted = 0 AND locality IS NOT NULL ORDER BY locality');
    const rows = stmt.all() as any[];
    return rows.map(r => r.locality).filter(Boolean);
  },

  async getDistinctCrystalSystems(): Promise<string[]> {
    const stmt = await prepare('SELECT DISTINCT crystal_system FROM thin_sections WHERE is_deleted = 0 AND crystal_system IS NOT NULL ORDER BY crystal_system');
    const rows = stmt.all() as any[];
    return rows.map(r => r.crystal_system).filter(Boolean);
  },
};

export const micrographDao = {
  async listBySection(sectionId: number): Promise<Micrograph[]> {
    const stmt = await prepare('SELECT * FROM micrographs WHERE section_id = ? ORDER BY mode, magnification');
    const rows = stmt.all([sectionId]);
    return rows.map(rowToMicrograph);
  },

  async create(data: Omit<Micrograph, 'id'>): Promise<Micrograph> {
    const stmt = await prepare(`
      INSERT INTO micrographs (
        section_id, mode, magnification, scale_bar_micrometers,
        image_path, analyzer_angle, accessory_plate, exposure_ms,
        notes, captured_at, captured_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      data.sectionId, data.mode, data.magnification, data.scaleBarMicrometers,
      data.imagePath, data.analyzerAngle ?? null, data.accessoryPlate ?? null,
      data.exposureMs ?? null, data.notes ?? null,
      data.capturedAt ?? null, data.capturedBy ?? null,
    ]);
    const id = await lastInsertId();
    return { ...data, id };
  },

  async delete(id: number): Promise<boolean> {
    const stmt = await prepare('DELETE FROM micrographs WHERE id = ?');
    stmt.run([id]);
    return (await changesCount()) > 0;
  },
};

export const opticsDao = {
  async getBySection(sectionId: number): Promise<MineralOptics | null> {
    const stmt = await prepare('SELECT * FROM mineral_optics WHERE section_id = ?');
    const row = stmt.get([sectionId]);
    return row ? rowToOptics(row) : null;
  },

  async save(data: Omit<MineralOptics, 'id'>): Promise<MineralOptics> {
    const existing = await this.getBySection(data.sectionId);

    if (existing) {
      const stmt = await prepare(`
        UPDATE mineral_optics SET
          relief = ?, refractive_index_min = ?, refractive_index_max = ?,
          birefringence = ?, optic_sign = ?, optic_axis_angle = ?,
          extinction_type = ?, extinction_angle = ?, pleochroism = ?,
          pleochroism_colors = ?, absorption_formula = ?, twinning_type = ?,
          twinning_description = ?, zoning = ?, inclusions_description = ?
        WHERE section_id = ?
      `);
      stmt.run([
        data.relief, data.refractiveIndexMin ?? null, data.refractiveIndexMax ?? null,
        data.birefringence ?? null, data.opticSign ?? null, data.opticAxisAngle ?? null,
        data.extinctionType ?? null, data.extinctionAngle ?? null, data.pleochroism ?? null,
        data.pleochroismColors ?? null, data.absorptionFormula ?? null, data.twinningType ?? null,
        data.twinningDescription ?? null, data.zoning, data.inclusionsDescription ?? null,
        data.sectionId,
      ]);
      return { ...data, id: existing.id };
    } else {
      const stmt = await prepare(`
        INSERT INTO mineral_optics (
          section_id, relief, refractive_index_min, refractive_index_max,
          birefringence, optic_sign, optic_axis_angle, extinction_type,
          extinction_angle, pleochroism, pleochroism_colors, absorption_formula,
          twinning_type, twinning_description, zoning, inclusions_description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run([
        data.sectionId, data.relief, data.refractiveIndexMin ?? null, data.refractiveIndexMax ?? null,
        data.birefringence ?? null, data.opticSign ?? null, data.opticAxisAngle ?? null,
        data.extinctionType ?? null, data.extinctionAngle ?? null, data.pleochroism ?? null,
        data.pleochroismColors ?? null, data.absorptionFormula ?? null, data.twinningType ?? null,
        data.twinningDescription ?? null, data.zoning, data.inclusionsDescription ?? null,
      ]);
      const id = await lastInsertId();
      return { ...data, id };
    }
  },
};

export const interferenceColorDao = {
  async listBySection(sectionId: number): Promise<InterferenceColor[]> {
    const stmt = await prepare('SELECT * FROM interference_colors WHERE section_id = ? ORDER BY "order"');
    const rows = stmt.all([sectionId]);
    return rows.map(rowToInterferenceColor);
  },

  async create(data: Omit<InterferenceColor, 'id'>): Promise<InterferenceColor> {
    const stmt = await prepare(`
      INSERT INTO interference_colors (
        section_id, mineral_grain_id, "order", color_name, color_hex,
        estimated_birefringence, thickness_micrometers, grain_orientation,
        is_anomalous, anomalous_description, accessory_plate_used, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      data.sectionId, data.mineralGrainId ?? null, data.order, data.colorName,
      data.colorHex, data.estimatedBirefringence, data.thicknessMicrometers,
      data.grainOrientation, data.isAnomalous ? 1 : 0,
      data.anomalousDescription ?? null, data.accessoryPlateUsed ?? null,
      data.notes ?? null,
    ]);
    const id = await lastInsertId();
    return { ...data, id };
  },

  async update(id: number, data: Partial<InterferenceColor>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    const fieldMap: Record<string, string> = {
      mineralGrainId: 'mineral_grain_id',
      order: '"order"',
      colorName: 'color_name',
      colorHex: 'color_hex',
      estimatedBirefringence: 'estimated_birefringence',
      thicknessMicrometers: 'thickness_micrometers',
      grainOrientation: 'grain_orientation',
      isAnomalous: 'is_anomalous',
      anomalousDescription: 'anomalous_description',
      accessoryPlateUsed: 'accessory_plate_used',
      notes: 'notes',
    };

    for (const [key, value] of Object.entries(data)) {
      const dbField = fieldMap[key];
      if (!dbField) continue;
      fields.push(`${dbField} = ?`);
      params.push(key === 'isAnomalous' ? (value ? 1 : 0) : value);
    }

    if (fields.length === 0) return false;
    params.push(id);

    const stmt = await prepare(`UPDATE interference_colors SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(params);
    return (await changesCount()) > 0;
  },

  async delete(id: number): Promise<boolean> {
    const stmt = await prepare('DELETE FROM interference_colors WHERE id = ?');
    stmt.run([id]);
    return (await changesCount()) > 0;
  },
};

export const cleavageDao = {
  async listBySection(sectionId: number): Promise<Cleavage[]> {
    const stmt = await prepare('SELECT * FROM cleavages WHERE section_id = ?');
    const rows = stmt.all([sectionId]);
    return rows.map(rowToCleavage);
  },

  async create(data: Omit<Cleavage, 'id'>): Promise<Cleavage> {
    const stmt = await prepare(`
      INSERT INTO cleavages (
        section_id, mineral_grain_id, quality, number_of_directions,
        angle_between_directions, cleavage_trace, parting_description,
        fracture_type, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      data.sectionId, data.mineralGrainId ?? null, data.quality,
      data.numberOfDirections, data.angleBetweenDirections ?? null,
      data.cleavageTrace ?? null, data.partingDescription ?? null,
      data.fractureType ?? null, data.notes ?? null,
    ]);
    const id = await lastInsertId();
    return { ...data, id };
  },

  async update(id: number, data: Partial<Cleavage>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    const fieldMap: Record<string, string> = {
      mineralGrainId: 'mineral_grain_id',
      quality: 'quality',
      numberOfDirections: 'number_of_directions',
      angleBetweenDirections: 'angle_between_directions',
      cleavageTrace: 'cleavage_trace',
      partingDescription: 'parting_description',
      fractureType: 'fracture_type',
      notes: 'notes',
    };

    for (const [key, value] of Object.entries(data)) {
      const dbField = fieldMap[key];
      if (!dbField) continue;
      fields.push(`${dbField} = ?`);
      params.push(value);
    }

    if (fields.length === 0) return false;
    params.push(id);

    const stmt = await prepare(`UPDATE cleavages SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(params);
    return (await changesCount()) > 0;
  },

  async delete(id: number): Promise<boolean> {
    const stmt = await prepare('DELETE FROM cleavages WHERE id = ?');
    stmt.run([id]);
    return (await changesCount()) > 0;
  },
};

export const associationDao = {
  async listBySection(sectionId: number): Promise<Association[]> {
    const stmt = await prepare('SELECT * FROM associations WHERE section_id = ? ORDER BY abundance_percent DESC');
    const rows = stmt.all([sectionId]);
    return rows.map(rowToAssociation);
  },

  async create(data: Omit<Association, 'id'>): Promise<Association> {
    const stmt = await prepare(`
      INSERT INTO associations (
        section_id, associated_mineral, relationship_type,
        textural_relation, abundance_percent, grain_size_mm,
        paragenetic_stage, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      data.sectionId, data.associatedMineral, data.relationshipType,
      data.texturalRelation, data.abundancePercent,
      data.grainSizeMm ?? null, data.parageneticStage ?? null,
      data.notes ?? null,
    ]);
    const id = await lastInsertId();
    return { ...data, id };
  },

  async update(id: number, data: Partial<Association>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    const fieldMap: Record<string, string> = {
      associatedMineral: 'associated_mineral',
      relationshipType: 'relationship_type',
      texturalRelation: 'textural_relation',
      abundancePercent: 'abundance_percent',
      grainSizeMm: 'grain_size_mm',
      parageneticStage: 'paragenetic_stage',
      notes: 'notes',
    };

    for (const [key, value] of Object.entries(data)) {
      const dbField = fieldMap[key];
      if (!dbField) continue;
      fields.push(`${dbField} = ?`);
      params.push(value);
    }

    if (fields.length === 0) return false;
    params.push(id);

    const stmt = await prepare(`UPDATE associations SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(params);
    return (await changesCount()) > 0;
  },

  async delete(id: number): Promise<boolean> {
    const stmt = await prepare('DELETE FROM associations WHERE id = ?');
    stmt.run([id]);
    return (await changesCount()) > 0;
  },
};

export const versionDao = {
  async listBySection(sectionId: number): Promise<VersionHistory[]> {
    const stmt = await prepare('SELECT * FROM version_history WHERE section_id = ? ORDER BY version DESC, changed_at DESC');
    const rows = stmt.all([sectionId]);
    return rows.map(rowToVersionHistory);
  },

  async listByBatch(batchId: string): Promise<VersionHistory[]> {
    const stmt = await prepare('SELECT * FROM version_history WHERE batch_id = ? ORDER BY changed_at DESC');
    const rows = stmt.all([batchId]);
    return rows.map(rowToVersionHistory);
  },

  async create(data: Omit<VersionHistory, 'id' | 'changedAt'>): Promise<VersionHistory> {
    const stmt = await prepare(`
      INSERT INTO version_history (
        section_id, version, change_type, field_name, old_value,
        new_value, change_description, changed_by, batch_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      data.sectionId, data.version, data.changeType,
      data.fieldName ?? null, data.oldValue ?? null,
      data.newValue ?? null, data.changeDescription,
      data.changedBy ?? null, data.batchId ?? null,
    ]);
    const id = await lastInsertId();
    const now = new Date().toISOString();
    return { ...data, id, changedAt: now };
  },

  async getDistinctBatches(): Promise<{ batchId: string; count: number; earliestAt: string; latestAt: string }[]> {
    const stmt = await prepare(`
      SELECT batch_id, COUNT(*) as count,
             MIN(changed_at) as earliest_at,
             MAX(changed_at) as latest_at
      FROM version_history
      WHERE batch_id IS NOT NULL
      GROUP BY batch_id
      ORDER BY latest_at DESC
    `);
    const rows = stmt.all() as any[];
    return rows.map(r => ({
      batchId: r.batch_id,
      count: r.count,
      earliestAt: r.earliest_at,
      latestAt: r.latest_at,
    }));
  },

  async listRecent(limit = 100): Promise<(VersionHistory & { mineralName?: string; thinSectionNumber?: string })[]> {
    const stmt = await prepare(`
      SELECT vh.*, ts.mineral_name, ts.thin_section_number
      FROM version_history vh
      LEFT JOIN thin_sections ts ON ts.id = vh.section_id
      ORDER BY vh.changed_at DESC
      LIMIT ?
    `);
    const rows = stmt.all([limit]) as any[];
    return rows.map(r => ({
      ...rowToVersionHistory(r),
      mineralName: r.mineral_name,
      thinSectionNumber: r.thin_section_number,
    }));
  },
};

export const anomalyDao = {
  async listBySection(sectionId: number, includeResolved = false): Promise<DataAnomaly[]> {
    const sql = includeResolved
      ? 'SELECT * FROM data_anomalies WHERE section_id = ? ORDER BY severity DESC, detected_at DESC'
      : 'SELECT * FROM data_anomalies WHERE section_id = ? AND resolved_at IS NULL ORDER BY severity DESC, detected_at DESC';
    const stmt = await prepare(sql);
    const rows = stmt.all([sectionId]);
    return rows.map(rowToAnomaly);
  },

  async listAll(includeResolved = false): Promise<DataAnomaly[]> {
    const sql = includeResolved
      ? 'SELECT * FROM data_anomalies ORDER BY severity DESC, detected_at DESC'
      : 'SELECT * FROM data_anomalies WHERE resolved_at IS NULL ORDER BY severity DESC, detected_at DESC';
    const stmt = await prepare(sql);
    const rows = stmt.all();
    return rows.map(rowToAnomaly);
  },

  async create(data: Omit<DataAnomaly, 'id' | 'detectedAt'>): Promise<DataAnomaly> {
    const stmt = await prepare(`
      INSERT INTO data_anomalies (
        section_id, anomaly_type, severity, field_name,
        current_value, expected_range, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      data.sectionId, data.anomalyType, data.severity,
      data.fieldName ?? null, data.currentValue ?? null,
      data.expectedRange ?? null, data.description,
    ]);
    const id = await lastInsertId();
    const now = new Date().toISOString();
    return { ...data, id, detectedAt: now };
  },

  async resolve(id: number, note?: string): Promise<boolean> {
    const stmt = await prepare(`
      UPDATE data_anomalies 
      SET resolved_at = CURRENT_TIMESTAMP, resolver_note = ?
      WHERE id = ?
    `);
    stmt.run([note ?? null, id]);
    return (await changesCount()) > 0;
  },

  async deleteResolvedBySection(sectionId: number): Promise<number> {
    const stmt = await prepare('DELETE FROM data_anomalies WHERE section_id = ? AND resolved_at IS NOT NULL');
    stmt.run([sectionId]);
    return await changesCount();
  },
};

export const sampleBoxDao = {
  async list(): Promise<SampleBox[]> {
    const stmt = await prepare('SELECT * FROM sample_boxes ORDER BY created_at DESC');
    const rows = stmt.all();
    return rows.map(rowToSampleBox);
  },

  async getById(id: number): Promise<(SampleBox & { slots: BoxSlot[]; sectionCount: number }) | null> {
    const stmt = await prepare('SELECT * FROM sample_boxes WHERE id = ?');
    const row = stmt.get([id]);
    if (!row) return null;

    const slotStmt = await prepare('SELECT * FROM box_slots WHERE box_id = ? ORDER BY row, col');
    const slotRows = slotStmt.all([id]) as any[];
    const slots: BoxSlot[] = slotRows.map(s => ({
      boxId: s.box_id,
      row: s.row,
      col: s.col,
      sectionId: s.section_id,
      label: s.label,
    }));

    const countStmt = await prepare('SELECT COUNT(*) as cnt FROM box_slots WHERE box_id = ? AND section_id IS NOT NULL');
    const sectionCount = countStmt.get([id]) as any;

    return {
      ...rowToSampleBox(row),
      slots,
      sectionCount: sectionCount?.cnt || 0,
    };
  },

  async create(data: Omit<SampleBox, 'id' | 'createdAt'>): Promise<SampleBox> {
    const stmt = await prepare(`
      INSERT INTO sample_boxes (name, code, rows, columns, location, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run([data.name, data.code, data.rows, data.columns, data.location ?? null, data.description ?? null]);

    const boxId = await lastInsertId();
    for (let r = 0; r < data.rows; r++) {
      for (let c = 0; c < data.columns; c++) {
        const slotStmt = await prepare('INSERT INTO box_slots (box_id, row, col) VALUES (?, ?, ?)');
        slotStmt.run([boxId, r, c]);
      }
    }

    const now = new Date().toISOString();
    return { ...data, id: boxId, createdAt: now };
  },

  async updateSlot(boxId: number, row: number, col: number, data: { sectionId?: number | null; label?: string | null }): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if ('sectionId' in data) {
      fields.push('section_id = ?');
      params.push(data.sectionId);
    }
    if ('label' in data) {
      fields.push('label = ?');
      params.push(data.label);
    }

    if (fields.length === 0) return false;
    params.push(boxId, row, col);

    const stmt = await prepare(`UPDATE box_slots SET ${fields.join(', ')} WHERE box_id = ? AND row = ? AND col = ?`);
    stmt.run(params);

    if ('sectionId' in data && data.sectionId !== undefined && data.sectionId !== null) {
      const position = `${String.fromCharCode(65 + row)}${col + 1}`;
      const updateStmt = await prepare('UPDATE thin_sections SET sample_box_id = ?, box_position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      updateStmt.run([boxId, position, data.sectionId]);
    }

    return (await changesCount()) > 0;
  },

  async delete(id: number): Promise<boolean> {
    const stmt = await prepare('DELETE FROM sample_boxes WHERE id = ?');
    stmt.run([id]);
    return (await changesCount()) > 0;
  },
};

export const anomalyDetector = {
  async checkAll(sectionId: number): Promise<DataAnomaly[]> {
    const delStmt = await prepare('DELETE FROM data_anomalies WHERE section_id = ? AND resolved_at IS NULL');
    delStmt.run([sectionId]);

    const section = await sectionDao.getById(sectionId);
    if (!section) return [];

    const anomalies: Omit<DataAnomaly, 'id' | 'detectedAt'>[] = [];

    if (section.thicknessMicrometers < 10 || section.thicknessMicrometers > 60) {
      anomalies.push({
        sectionId,
        anomalyType: 'thickness_out_of_range',
        severity: section.thicknessMicrometers < 10 || section.thicknessMicrometers > 60 ? 'high' : 'medium',
        fieldName: 'thicknessMicrometers',
        currentValue: section.thicknessMicrometers.toString(),
        expectedRange: '10-60 μm',
        description: `薄片厚度 ${section.thicknessMicrometers}μm 超出标准范围 (10-60μm)，可能影响干涉色观察准确性`,
      });
    }

    if (section.optics) {
      if (section.optics.birefringence !== undefined) {
        if (section.optics.birefringence < 0 || section.optics.birefringence > 0.4) {
          anomalies.push({
            sectionId,
            anomalyType: 'birefringence_out_of_range',
            severity: 'high',
            fieldName: 'birefringence',
            currentValue: section.optics.birefringence.toString(),
            expectedRange: '0.000-0.400',
            description: `双折射率 ${section.optics.birefringence} 超出常见矿物范围`,
          });
        }
      }

      if (section.optics.refractiveIndexMin !== undefined && section.optics.refractiveIndexMax !== undefined) {
        if (section.optics.refractiveIndexMin > section.optics.refractiveIndexMax) {
          anomalies.push({
            sectionId,
            anomalyType: 'refractive_index_inverted',
            severity: 'critical',
            fieldName: 'refractiveIndex',
            currentValue: `min=${section.optics.refractiveIndexMin}, max=${section.optics.refractiveIndexMax}`,
            expectedRange: 'min <= max',
            description: '最小折射率大于最大折射率，数据可能存在错误',
          });
        }
      }

      if (section.optics.relief < -2 || section.optics.relief > 6) {
        anomalies.push({
          sectionId,
          anomalyType: 'relief_out_of_range',
          severity: 'medium',
          fieldName: 'relief',
          currentValue: section.optics.relief.toString(),
          expectedRange: '-2 到 +6',
          description: `突起值 ${section.optics.relief} 超出标准范围`,
        });
      }
    }

    for (const ic of section.interferenceColors) {
      if (ic.estimatedBirefringence < 0 || ic.estimatedBirefringence > 0.4) {
        anomalies.push({
          sectionId,
          anomalyType: 'interference_birefringence_mismatch',
          severity: 'medium',
          fieldName: 'estimatedBirefringence',
          currentValue: ic.estimatedBirefringence.toString(),
          expectedRange: '0.000-0.400',
          description: `干涉色记录 #${ic.id} 的估算双折射率异常`,
        });
      }

      if (ic.order < 1 || ic.order > 5) {
        anomalies.push({
          sectionId,
          anomalyType: 'interference_order_invalid',
          severity: 'low',
          fieldName: 'order',
          currentValue: ic.order.toString(),
          expectedRange: '1-5',
          description: `干涉色级序 ${ic.order} 超出常见范围 (1-5)`,
        });
      }
    }

    const totalAbundance = section.associations.reduce((sum, a) => sum + a.abundancePercent, 0) + 100;
    if (totalAbundance > 120) {
      anomalies.push({
        sectionId,
        anomalyType: 'abundance_sum_exceeded',
        severity: 'high',
        fieldName: 'abundancePercent',
        currentValue: totalAbundance.toString(),
        expectedRange: '≈100',
        description: `主矿物 + 伴生矿物总含量 ${totalAbundance}%，可能存在估计偏差`,
      });
    }

    if (section.micrographs.length === 0) {
      anomalies.push({
        sectionId,
        anomalyType: 'no_micrographs',
        severity: 'low',
        description: '该薄片记录缺少显微照片，建议补充单偏光、正交偏光照片',
      });
    }

    if (!section.optics) {
      anomalies.push({
        sectionId,
        anomalyType: 'no_optical_data',
        severity: 'medium',
        description: '缺少光学性质数据，建议补充突起、消光类型等信息',
      });
    }

    const created = new Date(section.createdAt);
    const updated = new Date(section.updatedAt);
    const daysDiff = (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365 && section.currentVersion < 3) {
      anomalies.push({
        sectionId,
        anomalyType: 'stale_record',
        severity: 'low',
        description: `该记录已 ${Math.floor(daysDiff)} 天未更新，建议复核数据有效性`,
      });
    }

    for (const a of anomalies) {
      await anomalyDao.create(a);
    }

    return anomalyDao.listBySection(sectionId);
  },
};
