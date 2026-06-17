export type OpticalOrientation = 'parallel' | 'inclined' | 'perpendicular';
export type ExtinctionType = 'parallel' | 'symmetrical' | 'oblique' | 'undulose';
export type CleavageQuality = 'perfect' | 'good' | 'distinct' | 'indistinct' | 'absent';
export type TwinningType = 'simple' | 'polysynthetic' | 'cyclic' | 'none';
export type PolarizationMode = 'ppl' | 'xpl' | 'cnl';
export type SectionType = {
  id: number;
  sampleNumber: string;
  mineralName: string;
  mineralFormula?: string;
  crystalSystem?: string;
  locality?: string;
  collectionDate?: string;
  collector?: string;
  thinSectionNumber: string;
  thicknessMicrometers: number;
  coverSlip: boolean;
  mountingMedium?: string;
  grainSizeMm?: number;
  rockType?: string;
  alterationDegree?: number;
  sampleBoxId?: number;
  boxPosition?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: number;
  isDeleted: number;
};

export type Micrograph = {
  id: number;
  sectionId: number;
  mode: PolarizationMode;
  magnification: number;
  scaleBarMicrometers: number;
  imagePath: string;
  analyzerAngle?: number;
  accessoryPlate?: string;
  exposureMs?: number;
  notes?: string;
  capturedAt?: string;
  capturedBy?: string;
};

export type MineralOptics = {
  id: number;
  sectionId: number;
  relief: number;
  refractiveIndexMin?: number;
  refractiveIndexMax?: number;
  birefringence?: number;
  opticSign?: 'positive' | 'negative' | 'unknown';
  opticAxisAngle?: number;
  extinctionType?: ExtinctionType;
  extinctionAngle?: number;
  pleochroism?: string;
  pleochroismColors?: string;
  absorptionFormula?: string;
  twinningType?: TwinningType;
  twinningDescription?: string;
  zoning: number;
  inclusionsDescription?: string;
};

export type InterferenceColor = {
  id: number;
  sectionId: number;
  mineralGrainId?: string;
  order: number;
  colorName: string;
  colorHex: string;
  estimatedBirefringence: number;
  thicknessMicrometers: number;
  grainOrientation: OpticalOrientation;
  isAnomalous: number;
  anomalousDescription?: string;
  accessoryPlateUsed?: string;
  notes?: string;
};

export type Cleavage = {
  id: number;
  sectionId: number;
  mineralGrainId?: string;
  quality: CleavageQuality;
  numberOfDirections: number;
  angleBetweenDirections?: number;
  cleavageTrace?: string;
  partingDescription?: string;
  fractureType?: string;
  notes?: string;
};

export type Association = {
  id: number;
  sectionId: number;
  associatedMineral: string;
  relationshipType: string;
  texturalRelation: string;
  abundancePercent: number;
  grainSizeMm?: number;
  parageneticStage?: string;
  notes?: string;
};

export type SampleBox = {
  id: number;
  name: string;
  code: string;
  rows: number;
  columns: number;
  location?: string;
  description?: string;
  createdAt: string;
};

export type BoxSlot = {
  boxId: number;
  row: number;
  col: number;
  sectionId?: number;
  label?: string;
};

export type VersionHistory = {
  id: number;
  sectionId: number;
  version: number;
  changeType: 'create' | 'update' | 'revert';
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changeDescription: string;
  changedBy?: string;
  changedAt: string;
  batchId?: string;
};

export type DataAnomaly = {
  id: number;
  sectionId: number;
  anomalyType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fieldName?: string;
  currentValue?: string;
  expectedRange?: string;
  description: string;
  detectedAt: string;
  resolvedAt?: string;
  resolverNote?: string;
};

export type SectionDetail = SectionType & {
  micrographs: Micrograph[];
  optics?: MineralOptics;
  interferenceColors: InterferenceColor[];
  cleavages: Cleavage[];
  associations: Association[];
  versionHistory: VersionHistory[];
  anomalies: DataAnomaly[];
  box?: SampleBox & { position?: string };
};

export type SectionListItem = SectionType & {
  micrographCount: number;
  interferenceColorCount: number;
  associationCount: number;
  anomalyCount: number;
  latestVersionAt: string;
  boxName?: string;
};
