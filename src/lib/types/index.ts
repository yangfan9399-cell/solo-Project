export type SealScriptType = 'zhuwen' | 'baiwen' | 'mixed';
export type SealShape = 'square' | 'rectangle' | 'round' | 'oval' | 'irregular';
export type DraftStatus = 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'archived';
export type Priority = 'high' | 'medium' | 'low';
export type BorderType = 'none' | 'single' | 'double' | 'broken' | 'thick' | 'patterned';
export type DensityLevel = 'very_sparse' | 'sparse' | 'balanced' | 'dense' | 'very_dense';
export type KnifeTechnique = 'chongdao' | 'qiedao' | 'liuidao' | 'chuodao' | 'mixed';

export interface SealDimension {
	width: number;
	height: number;
	unit: 'mm' | 'cm' | 'fen';
}

export interface BorderAssessment {
	type: BorderType;
	thickness: number;
	breakages: number[];
	cornerTreatment: string;
	balanceScore: number;
	notes: string;
}

export interface ZhuBaiAnalysis {
	type: SealScriptType;
	zhuRatio: number;
	baiRatio: number;
	contrastScore: number;
	balanceScore: number;
	strokeDistribution: {
		top: number;
		bottom: number;
		left: number;
		right: number;
		center: number;
	};
	notes: string;
}

export interface DensityZone {
	name: string;
	level: DensityLevel;
	strokeCount: number;
	areaRatio: number;
}

export interface DensityAssessment {
	overallLevel: DensityLevel;
	zones: DensityZone[];
	balanceScore: number;
	zhuDensity: DensityLevel;
	baiDensity: DensityLevel;
	notes: string;
}

export interface StrokeAnalysis {
	totalStrokes: number;
	averageWidth: number;
	widthVariance: number;
	cornerCount: number;
	turningCount: number;
}

export interface KnifeTechniqueSuggestion {
	recommended: KnifeTechnique;
	alternatives: KnifeTechnique[];
	strokeAnalysis: StrokeAnalysis;
	forceDistribution: {
		heavy: number;
		medium: number;
		light: number;
	};
	difficultyLevel: number;
	suggestions: string[];
	warnings: string[];
}

export interface CharacterPosition {
	index: number;
	character: string;
	x: number;
	y: number;
	width: number;
	height: number;
	rotation: number;
	strokeCount: number;
}

export interface DraftVersion {
	id: string;
	draftId: string;
	versionNumber: number;
	batchNumber?: string;
	label: string;
	description: string;
	imageData: string;
	characters: CharacterPosition[];
	border: BorderAssessment;
	zhuBai: ZhuBaiAnalysis;
	density: DensityAssessment;
	knifeTechnique: KnifeTechniqueSuggestion;
	createdAt: number;
	createdBy: string;
	parentVersionId?: string;
	changeSummary: string[];
	isCurrent: boolean;
}

export interface ReviewComment {
	id: string;
	reviewId: string;
	author: string;
	content: string;
	createdAt: number;
	topic: 'layout' | 'zhuBai' | 'border' | 'density' | 'knife' | 'general';
	resolved: boolean;
	x?: number;
	y?: number;
}

export interface Review {
	id: string;
	draftId: string;
	versionId: string;
	reviewer: string;
	status: DraftStatus;
	overallScore: number;
	layoutScore: number;
	zhuBaiScore: number;
	borderScore: number;
	densityScore: number;
	knifeScore: number;
	comments: ReviewComment[];
	summary: string;
	createdAt: number;
	updatedAt: number;
}

export interface Anomaly {
	id: string;
	draftId: string;
	versionId?: string;
	type: 'data_incomplete' | 'score_outlier' | 'version_conflict' | 'review_overdue' | 'image_corrupted';
	severity: Priority;
	message: string;
	details: Record<string, unknown>;
	resolved: boolean;
	createdAt: number;
}

export interface SealDraft {
	id: string;
	title: string;
	description: string;
	shape: SealShape;
	dimension: SealDimension;
	status: DraftStatus;
	priority: Priority;
	creator: string;
	owner: string;
	tags: string[];
	currentVersionId: string;
	versionCount: number;
	reviewCount: number;
	createdAt: number;
	updatedAt: number;
	dueDate?: number;
	batchId?: string;
}

export interface DraftExport {
	draft: SealDraft;
	versions: DraftVersion[];
	reviews: Review[];
	anomalies: Anomaly[];
	exportedAt: number;
	formatVersion: string;
}

export interface FilterState {
	keyword: string;
	status: DraftStatus | 'all';
	priority: Priority | 'all';
	shape: SealShape | 'all';
	scriptType: SealScriptType | 'all';
	tag: string;
	dateFrom: number | null;
	dateTo: number | null;
	creator: string;
	sortBy: 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'status';
	sortOrder: 'asc' | 'desc';
}

export interface AppState {
	drafts: SealDraft[];
	versions: DraftVersion[];
	reviews: Review[];
	anomalies: Anomaly[];
	initialized: boolean;
}
