<script lang="ts">
	import { sessionStore, windStore, currentLevel } from '$lib/data/store';
	import type { GameScores } from '$lib/data/types';

	let session = $derived($sessionStore);
	let level = $derived($currentLevel);
	let windData = $derived($windStore);
	let reportData = $state<any>(null);
	let generating = $state(false);

	async function generateReport() {
		if (!session || !level) return;
		generating = true;
		try {
			const res = await fetch('/api/score', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ levelId: level.id, buildings: session.buildings })
			});
			if (res.ok) {
				reportData = await res.json();
			}
		} finally {
			generating = false;
		}
	}

	function scoreColor(score: number, min: number): string {
		if (score >= min) return 'var(--success)';
		if (score >= min * 0.7) return 'var(--warning)';
		return 'var(--danger)';
	}
</script>

<div class="report-panel card">
	<h3>📋 研究报告</h3>

	<button class="btn-primary" onclick={generateReport} disabled={generating || !session}>
		{generating ? '生成中...' : '生成报告（后端验算）'}
	</button>

	{#if reportData}
		<div class="report-content">
			<div class="report-header">
				<h4>{reportData.levelName} - 风洞测试报告</h4>
				<span class="report-time">{new Date(reportData.timestamp).toLocaleString()}</span>
			</div>

			<div class="report-scores">
				<div class="score-item">
					<div class="score-label">舒适度</div>
					<div class="score-value" style="color: {scoreColor(reportData.scores.comfort, level?.objective.comfortMin ?? 0)}">
						{reportData.scores.comfort}
					</div>
					<div class="score-bar">
						<div class="score-bar-fill" style="width: {reportData.scores.comfort}%; background: {scoreColor(reportData.scores.comfort, level?.objective.comfortMin ?? 0)};"></div>
					</div>
					<div class="score-req">需求 ≥{level?.objective.comfortMin}</div>
				</div>
				<div class="score-item">
					<div class="score-label">安全性</div>
					<div class="score-value" style="color: {scoreColor(reportData.scores.safety, level?.objective.safetyMin ?? 0)}">
						{reportData.scores.safety}
					</div>
					<div class="score-bar">
						<div class="score-bar-fill" style="width: {reportData.scores.safety}%; background: {scoreColor(reportData.scores.safety, level?.objective.safetyMin ?? 0)};"></div>
					</div>
					<div class="score-req">需求 ≥{level?.objective.safetyMin}</div>
				</div>
				<div class="score-item">
					<div class="score-label">通风效率</div>
					<div class="score-value" style="color: {scoreColor(reportData.scores.efficiency, level?.objective.efficiencyMin ?? 0)}">
						{reportData.scores.efficiency}
					</div>
					<div class="score-bar">
						<div class="score-bar-fill" style="width: {reportData.scores.efficiency}%; background: {scoreColor(reportData.scores.efficiency, level?.objective.efficiencyMin ?? 0)};"></div>
					</div>
					<div class="score-req">需求 ≥{level?.objective.efficiencyMin}</div>
				</div>
				<div class="score-item total">
					<div class="score-label">综合得分</div>
					<div class="score-value" style="color: {scoreColor(reportData.scores.total, level?.objective.totalMin ?? 0)}">
						{reportData.scores.total}
					</div>
					<div class="score-bar">
						<div class="score-bar-fill" style="width: {reportData.scores.total}%; background: {scoreColor(reportData.scores.total, level?.objective.totalMin ?? 0)};"></div>
					</div>
					<div class="score-req">需求 ≥{level?.objective.totalMin}</div>
				</div>
			</div>

			<div class="report-breakdown">
				<h5>详细分析</h5>
				<pre>{reportData.breakdown}</pre>
			</div>

			<div class="report-verdict">
				{#if reportData.passed}
					<div class="verdict pass">✅ 通关！方案满足所有风环境指标</div>
				{:else}
					<div class="verdict fail">❌ 未通过，请调整建筑布局后重试</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.report-panel h3 {
		font-size: 16px;
		color: var(--accent);
		margin-bottom: 12px;
	}

	.report-content {
		margin-top: 16px;
	}

	.report-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border);
	}

	.report-header h4 {
		font-size: 16px;
	}

	.report-time {
		font-size: 11px;
		color: var(--text-secondary);
	}

	.report-scores {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
		margin-bottom: 16px;
	}

	.score-item {
		background: var(--bg-card);
		border-radius: 8px;
		padding: 10px;
	}

	.score-item.total {
		grid-column: 1 / -1;
		background: rgba(56, 189, 248, 0.08);
		border: 1px solid var(--accent);
	}

	.score-label {
		font-size: 11px;
		color: var(--text-secondary);
		text-transform: uppercase;
		margin-bottom: 4px;
	}

	.score-value {
		font-size: 24px;
		font-weight: 800;
		margin-bottom: 4px;
	}

	.score-req {
		font-size: 11px;
		color: var(--text-secondary);
		margin-top: 4px;
	}

	.report-breakdown {
		margin-bottom: 16px;
	}

	.report-breakdown h5 {
		font-size: 14px;
		margin-bottom: 8px;
	}

	.report-breakdown pre {
		background: var(--bg-card);
		border-radius: 8px;
		padding: 12px;
		font-size: 12px;
		overflow-x: auto;
		line-height: 1.6;
		color: var(--text-secondary);
	}

	.verdict {
		text-align: center;
		padding: 12px;
		border-radius: 8px;
		font-weight: 700;
		font-size: 16px;
	}

	.verdict.pass {
		background: rgba(74, 222, 128, 0.15);
		color: var(--success);
		border: 1px solid var(--success);
	}

	.verdict.fail {
		background: rgba(248, 113, 113, 0.15);
		color: var(--danger);
		border: 1px solid var(--danger);
	}
</style>
