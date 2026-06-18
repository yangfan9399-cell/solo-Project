import type {
	SealDraft,
	DraftVersion,
	SealShape,
	SealScriptType,
	CharacterPosition,
	BorderAssessment,
	ZhuBaiAnalysis,
	DensityAssessment,
	KnifeTechniqueSuggestion,
	BorderType,
	DensityLevel,
	KnifeTechnique
} from '$lib/types';

const STORAGE_KEYS = {
	DRAFTS: 'seal_drafts',
	VERSIONS: 'seal_versions',
	REVIEWS: 'seal_reviews',
	ANOMALIES: 'seal_anomalies',
	INITIALIZED: 'seal_initialized'
};

function safeParse<T>(json: string | null, defaultValue: T): T {
	if (!json) return defaultValue;
	try {
		return JSON.parse(json) as T;
	} catch {
		return defaultValue;
	}
}

function getFromStorage<T>(key: string, defaultValue: T): T {
	if (typeof window === 'undefined') return defaultValue;
	const value = localStorage.getItem(key);
	return safeParse<T>(value, defaultValue);
}

function setToStorage<T>(key: string, value: T): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(key, JSON.stringify(value));
}

export function generateId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
}

export function getDrafts(): SealDraft[] {
	return getFromStorage<SealDraft[]>(STORAGE_KEYS.DRAFTS, []);
}

export function saveDrafts(drafts: SealDraft[]): void {
	setToStorage(STORAGE_KEYS.DRAFTS, drafts);
}

export function getVersions(): DraftVersion[] {
	return getFromStorage<DraftVersion[]>(STORAGE_KEYS.VERSIONS, []);
}

export function saveVersions(versions: DraftVersion[]): void {
	setToStorage(STORAGE_KEYS.VERSIONS, versions);
}

export function getReviews() {
	return getFromStorage<import('$lib/types').Review[]>(STORAGE_KEYS.REVIEWS, []);
}

export function saveReviews(reviews: import('$lib/types').Review[]): void {
	setToStorage(STORAGE_KEYS.REVIEWS, reviews);
}

export function getAnomalies() {
	return getFromStorage<import('$lib/types').Anomaly[]>(STORAGE_KEYS.ANOMALIES, []);
}

export function saveAnomalies(anomalies: import('$lib/types').Anomaly[]): void {
	setToStorage(STORAGE_KEYS.ANOMALIES, anomalies);
}

export function isInitialized(): boolean {
	return getFromStorage<boolean>(STORAGE_KEYS.INITIALIZED, false);
}

export function setInitialized(value: boolean): void {
	setToStorage(STORAGE_KEYS.INITIALIZED, value);
}

export function getDraftById(id: string): SealDraft | undefined {
	return getDrafts().find((d) => d.id === id);
}

export function getVersionsByDraftId(draftId: string): DraftVersion[] {
	return getVersions().filter((v) => v.draftId === draftId).sort((a, b) => a.versionNumber - b.versionNumber);
}

export function getVersionById(id: string): DraftVersion | undefined {
	return getVersions().find((v) => v.id === id);
}

export function getCurrentVersion(draftId: string): DraftVersion | undefined {
	return getVersionsByDraftId(draftId).find((v) => v.isCurrent);
}

export function addDraft(draft: SealDraft): void {
	const drafts = getDrafts();
	drafts.push(draft);
	saveDrafts(drafts);
}

export function updateDraft(id: string, updates: Partial<SealDraft>): void {
	const drafts = getDrafts();
	const index = drafts.findIndex((d) => d.id === id);
	if (index !== -1) {
		drafts[index] = { ...drafts[index], ...updates, updatedAt: Date.now() };
		saveDrafts(drafts);
	}
}

export function addVersion(version: DraftVersion): void {
	const versions = getVersions();
	versions.push(version);
	saveVersions(versions);
}

export function updateVersion(id: string, updates: Partial<DraftVersion>): void {
	const versions = getVersions();
	const index = versions.findIndex((v) => v.id === id);
	if (index !== -1) {
		versions[index] = { ...versions[index], ...updates };
		saveVersions(versions);
	}
}

export function addReview(review: import('$lib/types').Review): void {
	const reviews = getReviews();
	reviews.push(review);
	saveReviews(reviews);
}

export function updateReview(id: string, updates: Partial<import('$lib/types').Review>): void {
	const reviews = getReviews();
	const index = reviews.findIndex((r) => r.id === id);
	if (index !== -1) {
		reviews[index] = { ...reviews[index], ...updates, updatedAt: Date.now() };
		saveReviews(reviews);
	}
}

export function addReviewComment(reviewId: string, comment: import('$lib/types').ReviewComment): void {
	const reviews = getReviews();
	const index = reviews.findIndex((r) => r.id === reviewId);
	if (index !== -1) {
		reviews[index].comments.push(comment);
		reviews[index].updatedAt = Date.now();
		saveReviews(reviews);
	}
}

export function getReviewsByDraftId(draftId: string) {
	return getReviews().filter((r) => r.draftId === draftId).sort((a, b) => b.createdAt - a.createdAt);
}

export function addAnomaly(anomaly: import('$lib/types').Anomaly): void {
	const anomalies = getAnomalies();
	anomalies.push(anomaly);
	saveAnomalies(anomalies);
}

export function resolveAnomaly(id: string): void {
	const anomalies = getAnomalies();
	const index = anomalies.findIndex((a) => a.id === id);
	if (index !== -1) {
		anomalies[index] = { ...anomalies[index], resolved: true };
		saveAnomalies(anomalies);
	}
}

export function getUnresolvedAnomalies() {
	return getAnomalies().filter((a) => !a.resolved);
}

export function clearAllData(): void {
	Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export {
	type SealDraft,
	type DraftVersion,
	type SealShape,
	type SealScriptType,
	type CharacterPosition,
	type BorderAssessment,
	type ZhuBaiAnalysis,
	type DensityAssessment,
	type KnifeTechniqueSuggestion,
	type BorderType,
	type DensityLevel,
	type KnifeTechnique
};
