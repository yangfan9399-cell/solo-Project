export interface GlazeIngredient {
  id: string;
  name: string;
  formula?: string;
  molecularWeight?: number;
  category: 'filler' | 'flux' | 'stabilizer' | 'colorant' | 'opacifier' | 'other';
  notes?: string;
}

export interface RecipeComponent {
  ingredientId: string;
  ingredientName: string;
  percentage: number;
  locked: boolean;
}

export interface TestSpecimen {
  id: string;
  recipeId: string;
  versionId: string;
  position: { row: number; col: number };
  label: string;
  photoUrl?: string;
  firedColor?: string;
  surfaceQuality: 'excellent' | 'good' | 'fair' | 'poor';
  glossLevel: 'high' | 'medium' | 'low' | 'matte';
  defects: string[];
  notes?: string;
  firedAt?: string;
}

export interface RecipeVersion {
  id: string;
  recipeId: string;
  versionNumber: number;
  batchNumber?: string;
  components: RecipeComponent[];
  totalPercentage: number;
  firingTemperature: number;
  firingType: 'oxidation' | 'reduction' | 'soda' | 'wood' | 'salt';
  holdTime: number;
  createdAt: string;
  createdBy: string;
  changeNotes: string;
  isLocked: boolean;
  specimens: TestSpecimen[];
}

export interface GlazeRecipe {
  id: string;
  name: string;
  code: string;
  projectId: string;
  description?: string;
  coneTarget: string;
  currentVersionId: string;
  versions: RecipeVersion[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
  status: 'active' | 'archived' | 'experimental';
  matrixType: 'single' | 'binary' | 'ternary';
  matrixConfig?: MatrixConfig;
}

export interface MatrixConfig {
  type: 'binary' | 'ternary';
  baseIngredients: string[];
  minPercentages: number[];
  maxPercentages: number[];
  steps: number;
  fixedComponents: RecipeComponent[];
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  recipeCount: number;
  specimenCount: number;
  status: 'active' | 'completed' | 'on-hold';
  tags: string[];
  primaryKiln?: string;
  targetCone?: string;
}

export interface DataValidationIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  recipeId?: string;
  versionId?: string;
  specimenId?: string;
}

export interface ExportSummary {
  project: Project;
  recipes: GlazeRecipe[];
  exportedAt: string;
  format: 'json' | 'csv';
  summary: {
    totalRecipes: number;
    totalVersions: number;
    totalSpecimens: number;
    temperatureRange: { min: number; max: number };
  };
}

export type FiringType = 'oxidation' | 'reduction' | 'soda' | 'wood' | 'salt';
export type SurfaceQuality = 'excellent' | 'good' | 'fair' | 'poor';
export type GlossLevel = 'high' | 'medium' | 'low' | 'matte';
export type RecipeStatus = 'active' | 'archived' | 'experimental';
export type ProjectStatus = 'active' | 'completed' | 'on-hold';
