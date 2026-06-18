import { writable, derived } from 'svelte/store';
import {
	getDrafts,
	getVersions,
	getReviews,
	getAnomalies,
	saveDrafts,
	saveVersions,
	saveReviews,
	saveAnomalies,
	addDraft as storageAddDraft,
	updateDraft as storageUpdateDraft,
	addVersion as storageAddVersion,
	updateVersion as storageUpdateVersion,
	addReview as storageAddReview,
	updateReview as storageUpdateReview,
	addReviewComment as storageAddReviewComment,
	addAnomaly as storageAddAnomaly,
	getUnresolvedAnomalies,
	resolveAnomaly as storageResolveAnomaly,
	generateId
} from '$lib/stores/storage';
import { initializeSampleData } from '$lib/utils/sampleData';
import type { SealDraft, DraftVersion, Review, Anomaly, FilterState } from '$lib/types';

function createDraftsStore() {
	const { subscribe, set, update } = writable<SealDraft[]>([]);

	return {
		subscribe,
		init: () => {
			if (typeof window !== 'undefined') {
				const drafts = getDrafts();
				if (drafts.length === 0) {
					initializeSampleData();
					set(getDrafts());
				} else {
					set(drafts);
				}
			}
		},
		addDraft: (draft: SealDraft) => {
			update((drafts) => {
				storageAddDraft(draft);
				return [...drafts, draft];
			});
		},
		updateDraft: (id: string, updates: Partial<SealDraft>) => {
			update((drafts) => {
				storageUpdateDraft(id, updates);
				return drafts.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d));
			});
		},
		refresh: () => {
			set(getDrafts());
		}
	};
}

function createVersionsStore() {
	const { subscribe, set, update } = writable<DraftVersion[]>([]);

	return {
		subscribe,
		init: () => {
			if (typeof window !== 'undefined') {
				set(getVersions());
			}
		},
		addVersion: (version: DraftVersion) => {
			update((versions) => {
				storageAddVersion(version);
				return [...versions, version];
			});
		},
		updateVersion: (id: string, updates: Partial<DraftVersion>) => {
			update((versions) => {
				storageUpdateVersion(id, updates);
				return versions.map((v) => (v.id === id ? { ...v, ...updates } : v));
			});
		},
		setCurrentVersion: (draftId: string, versionId: string) => {
			update((versions) => {
				const updated = versions.map((v) => {
					if (v.draftId === draftId) {
						return { ...v, isCurrent: v.id === versionId };
					}
					return v;
				});
				saveVersions(updated);
				return updated;
			});
		},
		refresh: () => {
			set(getVersions());
		}
	};
}

function createReviewsStore() {
	const { subscribe, set, update } = writable<Review[]>([]);

	return {
		subscribe,
		init: () => {
			if (typeof window !== 'undefined') {
				set(getReviews());
			}
		},
		addReview: (review: Review) => {
			update((reviews) => {
				storageAddReview(review);
				return [...reviews, review];
			});
		},
		updateReview: (id: string, updates: Partial<Review>) => {
			update((reviews) => {
				storageUpdateReview(id, updates);
				return reviews.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r));
			});
		},
		addComment: (reviewId: string, comment: import('$lib/types').ReviewComment) => {
			update((reviews) => {
				storageAddReviewComment(reviewId, comment);
				return reviews.map((r) => {
					if (r.id === reviewId) {
						return {
							...r,
							comments: [...r.comments, comment],
							updatedAt: Date.now()
						};
					}
					return r;
				});
			});
		},
		refresh: () => {
			set(getReviews());
		}
	};
}

function createAnomaliesStore() {
	const { subscribe, set, update } = writable<Anomaly[]>([]);

	return {
		subscribe,
		init: () => {
			if (typeof window !== 'undefined') {
				set(getAnomalies());
			}
		},
		addAnomaly: (anomaly: Anomaly) => {
			update((anomalies) => {
				storageAddAnomaly(anomaly);
				return [...anomalies, anomaly];
			});
		},
		resolve: (id: string) => {
			update((anomalies) => {
				storageResolveAnomaly(id);
				return anomalies.map((a) => (a.id === id ? { ...a, resolved: true } : a));
			});
		},
		refresh: () => {
			set(getAnomalies());
		}
	};
}

function createFilterStore() {
	const { subscribe, set, update } = writable<FilterState>({
		keyword: '',
		status: 'all',
		priority: 'all',
		shape: 'all',
		scriptType: 'all',
		tag: '',
		dateFrom: null,
		dateTo: null,
		creator: '',
		sortBy: 'updatedAt',
		sortOrder: 'desc'
	});

	return {
		subscribe,
		set,
		update,
		reset: () => {
			set({
				keyword: '',
				status: 'all',
				priority: 'all',
				shape: 'all',
				scriptType: 'all',
				tag: '',
				dateFrom: null,
				dateTo: null,
				creator: '',
				sortBy: 'updatedAt',
				sortOrder: 'desc'
			});
		}
	};
}

export const draftsStore = createDraftsStore();
export const versionsStore = createVersionsStore();
export const reviewsStore = createReviewsStore();
export const anomaliesStore = createAnomaliesStore();
export const filterStore = createFilterStore();

export const filteredDrafts = derived(
	[draftsStore, filterStore, versionsStore],
	([$drafts, $filter, $versions]) => {
		let result = [...$drafts];

		if ($filter.keyword) {
			const kw = $filter.keyword.toLowerCase();
			result = result.filter(
				(d) =>
					d.title.toLowerCase().includes(kw) ||
					d.description.toLowerCase().includes(kw) ||
					d.tags.some((t) => t.toLowerCase().includes(kw))
			);
		}

		if ($filter.status !== 'all') {
			result = result.filter((d) => d.status === $filter.status);
		}

		if ($filter.priority !== 'all') {
			result = result.filter((d) => d.priority === $filter.priority);
		}

		if ($filter.shape !== 'all') {
			result = result.filter((d) => d.shape === $filter.shape);
		}

		if ($filter.scriptType !== 'all') {
			result = result.filter((d) => {
				const version = $versions.find((v) => v.id === d.currentVersionId);
				return version && version.zhuBai.type === $filter.scriptType;
			});
		}

		if ($filter.tag) {
			result = result.filter((d) => d.tags.includes($filter.tag));
		}

		if ($filter.creator) {
			result = result.filter((d) => d.creator === $filter.creator);
		}

		if ($filter.dateFrom) {
			result = result.filter((d) => d.createdAt >= $filter.dateFrom!);
		}

		if ($filter.dateTo) {
			result = result.filter((d) => d.createdAt <= $filter.dateTo!);
		}

		result.sort((a, b) => {
			let aVal: number | string = a[$filter.sortBy as keyof SealDraft] as number | string;
			let bVal: number | string = b[$filter.sortBy as keyof SealDraft] as number | string;

			if (typeof aVal === 'string' && typeof bVal === 'string') {
				return $filter.sortOrder === 'asc'
					? aVal.localeCompare(bVal)
					: bVal.localeCompare(aVal);
			}

			if ($filter.sortOrder === 'asc') {
				return (aVal as number) - (bVal as number);
			}
			return (bVal as number) - (aVal as number);
		});

		return result;
	}
);

export const stats = derived([draftsStore, anomaliesStore], ([$drafts, $anomalies]) => {
	const total = $drafts.length;
	const draftCount = $drafts.filter((d) => d.status === 'draft').length;
	const reviewing = $drafts.filter((d) => d.status === 'reviewing').length;
	const approved = $drafts.filter((d) => d.status === 'approved').length;
	const rejected = $drafts.filter((d) => d.status === 'rejected').length;
	const highPriority = $drafts.filter((d) => d.priority === 'high').length;
	const unresolvedAnomalies = $anomalies.filter((a) => !a.resolved).length;

	return {
		total,
		draft: draftCount,
		reviewing,
		approved,
		rejected,
		highPriority,
		unresolvedAnomalies
	};
});

export const allTags = derived(draftsStore, ($drafts) => {
	const tagSet = new Set<string>();
	$drafts.forEach((d) => d.tags.forEach((t) => tagSet.add(t)));
	return Array.from(tagSet).sort();
});

export const allCreators = derived(draftsStore, ($drafts) => {
	const creatorSet = new Set<string>();
	$drafts.forEach((d) => creatorSet.add(d.creator));
	return Array.from(creatorSet).sort();
});
