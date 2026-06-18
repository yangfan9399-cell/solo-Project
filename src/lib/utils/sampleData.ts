import {
	generateId,
	saveDrafts,
	saveVersions,
	saveReviews,
	saveAnomalies,
	setInitialized,
	getDrafts
} from '$lib/stores/storage';
import {
	generateSealSvg,
	generateBorderAssessment,
	generateZhuBaiAnalysis,
	generateDensityAssessment,
	generateKnifeTechniqueSuggestion,
	generateCharacterPositions
} from '$lib/utils/sealGenerator';
import type {
	SealDraft,
	DraftVersion,
	Review,
	ReviewComment,
	Anomaly,
	SealShape,
	SealScriptType,
	BorderType,
	DraftStatus,
	Priority
} from '$lib/types';

interface SampleDraftConfig {
	title: string;
	description: string;
	characters: string[];
	shape: SealShape;
	scriptType: SealScriptType;
	borderType: BorderType;
	status: DraftStatus;
	priority: Priority;
	tags: string[];
	versionCount: number;
	hasReview: boolean;
}

const sampleConfigs: SampleDraftConfig[] = [
	{
		title: '墨云轩主',
		description: '四字朱文闲章，用于书画落款。初拟方形，双边设计，需注意布局协调。',
		characters: ['墨', '云', '轩', '主'],
		shape: 'square',
		scriptType: 'zhuwen',
		borderType: 'double',
		status: 'reviewing',
		priority: 'high',
		tags: ['闲章', '朱文', '四字印'],
		versionCount: 3,
		hasReview: true
	},
	{
		title: '清风徐来',
		description: '白文四字印，风格工稳，拟用于藏书印。',
		characters: ['清', '风', '徐', '来'],
		shape: 'square',
		scriptType: 'baiwen',
		borderType: 'single',
		status: 'approved',
		priority: 'medium',
		tags: ['藏书印', '白文', '工稳'],
		versionCount: 2,
		hasReview: true
	},
	{
		title: '吉祥如意',
		description: '圆形吉语印，朱白相间，用于贺礼。',
		characters: ['吉', '祥', '如', '意'],
		shape: 'round',
		scriptType: 'mixed',
		borderType: 'single',
		status: 'submitted',
		priority: 'medium',
		tags: ['吉语印', '圆形', '朱白相间'],
		versionCount: 1,
		hasReview: false
	},
	{
		title: '宁静致远',
		description: '长方朱文印，拟用于引首章。设计为两字一行，共两行。',
		characters: ['宁', '静', '致', '远'],
		shape: 'rectangle',
		scriptType: 'zhuwen',
		borderType: 'single',
		status: 'draft',
		priority: 'low',
		tags: ['引首章', '长方', '朱文'],
		versionCount: 1,
		hasReview: false
	},
	{
		title: '道法自然',
		description: '白文四字印，拟仿汉印风格，粗边栏，厚重古朴。',
		characters: ['道', '法', '自', '然'],
		shape: 'square',
		scriptType: 'baiwen',
		borderType: 'thick',
		status: 'approved',
		priority: 'high',
		tags: ['汉印', '白文', '粗边'],
		versionCount: 4,
		hasReview: true
	},
	{
		title: '厚德载物',
		description: '大型方印，六字三行，用于正式场合盖章。',
		characters: ['厚', '德', '载', '物', '之', '印'],
		shape: 'square',
		scriptType: 'zhuwen',
		borderType: 'double',
		status: 'reviewing',
		priority: 'high',
		tags: ['官印', '六字印', '朱文'],
		versionCount: 2,
		hasReview: true
	},
	{
		title: '竹报平安',
		description: '椭圆形闲章，用于书信落款。',
		characters: ['竹', '报', '平', '安'],
		shape: 'oval',
		scriptType: 'zhuwen',
		borderType: 'single',
		status: 'rejected',
		priority: 'low',
		tags: ['闲章', '椭圆', '书信'],
		versionCount: 1,
		hasReview: true
	},
	{
		title: '山水有清音',
		description: '五字朱文多字印，布局难度较大，需特别注意疏密关系。',
		characters: ['山', '水', '有', '清', '音'],
		shape: 'square',
		scriptType: 'zhuwen',
		borderType: 'single',
		status: 'draft',
		priority: 'medium',
		tags: ['多字印', '朱文', '山水'],
		versionCount: 2,
		hasReview: false
	},
	{
		title: '墨趣',
		description: '两字小印，用于书画小品。残破边栏，追求古拙之趣。',
		characters: ['墨', '趣'],
		shape: 'square',
		scriptType: 'baiwen',
		borderType: 'broken',
		status: 'approved',
		priority: 'low',
		tags: ['小印', '两字', '残破'],
		versionCount: 1,
		hasReview: true
	},
	{
	 title: '学而时习之',
		description: '六字白文印，三行两列，儒家经典名句。',
		characters: ['学', '而', '时', '习', '之', '也'],
		shape: 'square',
		scriptType: 'baiwen',
		borderType: 'single',
		status: 'archived',
		priority: 'low',
		tags: ['名句印', '六字印', '白文'],
		versionCount: 3,
		hasReview: true
	}
];

function createDraft(config: SampleDraftConfig, index: number): SealDraft {
	const now = Date.now();
	const offset = (10 - index) * 86400000;
	const createdAt = now - offset;

	return {
		id: generateId(),
		title: config.title,
		description: config.description,
		shape: config.shape,
		dimension: {
			width: config.shape === 'rectangle' ? 40 : 25,
			height: config.shape === 'rectangle' ? 25 : 25,
			unit: 'mm'
		},
		status: config.status,
		priority: config.priority,
		creator: '张治印',
		owner: '李印人',
		tags: config.tags,
		currentVersionId: '',
		versionCount: config.versionCount,
		reviewCount: config.hasReview ? 1 : 0,
		createdAt,
		updatedAt: createdAt + 3600000 * index,
		dueDate: config.status === 'reviewing' ? now + 86400000 * 3 : undefined,
		batchId: index < 3 ? 'batch-2024-001' : index < 7 ? 'batch-2024-002' : 'batch-2024-003'
	};
}

function createVersions(
	draft: SealDraft,
	config: SampleDraftConfig
): DraftVersion[] {
	const versions: DraftVersion[] = [];
	let parentId: string | undefined;

	for (let i = 0; i < config.versionCount; i++) {
		const versionNumber = i + 1;
		const isCurrent = i === config.versionCount - 1;
		const id = generateId();

		const variantChars = [...config.characters];
		if (i > 0) {
			const shiftAmount = i * 0.5;
			config.characters.forEach((_, idx) => {
				if (idx % 2 === 0 && i % 2 === 1) {
					variantChars[idx] = config.characters[idx];
				}
			});
		}

		const imageData = generateSealSvg({
			shape: config.shape,
			scriptType: config.scriptType,
			borderType: config.borderType,
			characters: variantChars,
			size: 300
		});

		const version: DraftVersion = {
			id,
			draftId: draft.id,
			versionNumber,
			batchNumber: draft.batchId,
			label: `V${versionNumber}`,
			description: getVersionDescription(versionNumber, config),
			imageData,
			characters: generateCharacterPositions({
				shape: config.shape,
				scriptType: config.scriptType,
				borderType: config.borderType,
				characters: variantChars,
				size: 300
			}),
			border: generateBorderAssessment(config.borderType),
			zhuBai: generateZhuBaiAnalysis(config.scriptType, config.characters.length),
			density: generateDensityAssessment(config.characters.length),
			knifeTechnique: generateKnifeTechniqueSuggestion(config.characters.length),
			createdAt: draft.createdAt + i * 86400000 / 2,
			createdBy: draft.creator,
			parentVersionId: parentId,
			changeSummary: getChangeSummary(versionNumber),
			isCurrent
		};

		versions.push(version);
		parentId = id;

		if (isCurrent) {
			draft.currentVersionId = id;
		}
	}

	return versions;
}

function getVersionDescription(version: number, config: SampleDraftConfig): string {
	const descriptions = [
		`${config.title} - 初稿，确定整体布局方向`,
		`${config.title} - 修订版，调整字间距和边栏粗细`,
		`${config.title} - 优化版，细化笔画处理`,
		`${config.title} - 终稿前版本，综合评审意见修改`
	];
	return descriptions[version - 1] || descriptions[0];
}

function getChangeSummary(version: number): string[] {
	const summaries: Record<number, string[]> = {
		1: ['初始版本', '确定印面布局', '选择边栏样式'],
		2: ['调整字间距', '优化笔画粗细', '修正边栏比例'],
		3: ['细化刀法建议', '调整疏密关系', '优化朱白比例'],
		4: ['综合评审意见', '最终调整', '准备定稿']
	};
	return summaries[version] || summaries[1];
}

function createReview(draft: SealDraft, version: DraftVersion, index: number): Review {
	const statuses: DraftStatus[] = ['approved', 'rejected', 'reviewing'];
	const status = statuses[index % statuses.length];
	const baseScore = status === 'approved' ? 85 : status === 'rejected' ? 55 : 72;

	return {
		id: generateId(),
		draftId: draft.id,
		versionId: version.id,
		reviewer: ['王审之', '陈印友', '赵篆师'][index % 3],
		status,
		overallScore: baseScore + Math.floor(Math.random() * 10),
		layoutScore: baseScore + Math.floor(Math.random() * 8),
		zhuBaiScore: baseScore + Math.floor(Math.random() * 10),
		borderScore: baseScore + Math.floor(Math.random() * 7),
		densityScore: baseScore + Math.floor(Math.random() * 9),
		knifeScore: baseScore + Math.floor(Math.random() * 6),
		comments: [
			{
				id: generateId(),
				reviewId: '',
				author: '王审之',
				content: '整体布局协调，朱白分布合理。',
				createdAt: Date.now() - 86400000,
				topic: 'layout' as const,
				resolved: true
			},
			{
				id: generateId(),
				reviewId: '',
				author: '王审之',
				content: '建议右下角笔画稍作调整，增加变化。',
				createdAt: Date.now() - 80000000,
				topic: 'density' as const,
				resolved: status === 'approved'
			}
		].map((c) => ({ ...c, reviewId: '' })),
		summary: getReviewSummary(status, draft.title),
		createdAt: draft.updatedAt,
		updatedAt: draft.updatedAt + 3600000
	};
}

function getReviewSummary(status: DraftStatus, title: string): string {
	switch (status) {
		case 'approved':
			return `${title}印稿布局合理，朱白相宜，刀法建议切实可行，同意通过评审。建议在刻制时注意细节处理。`;
		case 'rejected':
			return `${title}印稿存在较多问题，布局不够协调，疏密关系需要重新考虑。建议重新设计后再提交评审。`;
		case 'reviewing':
			return `${title}印稿已进入评审流程，正在进行综合评估。请关注评审意见并及时修改。`;
		default:
			return '评审中...';
	}
}

function createAnomalies(drafts: SealDraft[], versions: DraftVersion[]): Anomaly[] {
	const anomalies: Anomaly[] = [];
	const now = Date.now();

	const draftWithIssue = drafts.find((d) => d.status === 'draft' && d.versionCount === 1);
	if (draftWithIssue) {
		anomalies.push({
			id: generateId(),
			draftId: draftWithIssue.id,
			type: 'data_incomplete',
			severity: 'medium',
			message: '印稿数据不完整，缺少尺寸信息',
			details: { field: 'dimension', missing: ['width', 'height'] },
			resolved: false,
			createdAt: now - 86400000
		});
	}

	const reviewingDraft = drafts.find((d) => d.status === 'reviewing');
	if (reviewingDraft && reviewingDraft.dueDate && reviewingDraft.dueDate < now + 86400000) {
		anomalies.push({
			id: generateId(),
			draftId: reviewingDraft.id,
			type: 'review_overdue',
			severity: 'high',
			message: '评审即将到期，请及时处理',
			details: { dueDate: reviewingDraft.dueDate, daysRemaining: 1 },
			resolved: false,
			createdAt: now - 3600000
		});
	}

	if (drafts.length > 5) {
		const draft = drafts[5];
		anomalies.push({
			id: generateId(),
			draftId: draft.id,
			type: 'score_outlier',
			severity: 'low',
			message: '评审分数分布异常，建议复核',
			details: { scoreRange: '40-95', standardDeviation: 18.5 },
			resolved: false,
			createdAt: now - 172800000
		});
	}

	return anomalies;
}

export function initializeSampleData(): void {
	if (getDrafts().length > 0) {
		return;
	}

	const drafts: SealDraft[] = [];
	const allVersions: DraftVersion[] = [];
	const allReviews: Review[] = [];

	sampleConfigs.forEach((config, index) => {
		const draft = createDraft(config, index);
		const versions = createVersions(draft, config);
		drafts.push(draft);
		allVersions.push(...versions);

		if (config.hasReview && versions.length > 0) {
			const currentVersion = versions.find((v) => v.isCurrent) || versions[versions.length - 1];
			const review = createReview(draft, currentVersion, index);
			review.comments = review.comments.map((c) => ({ ...c, reviewId: review.id }));
			allReviews.push(review);
		}
	});

	const anomalies = createAnomalies(drafts, allVersions);

	saveDrafts(drafts);
	saveVersions(allVersions);
	saveReviews(allReviews);
	saveAnomalies(anomalies);
	setInitialized(true);
}

export function resetSampleData(): void {
	localStorage.clear();
	initializeSampleData();
}
