<script lang="ts">
	import { onMount } from 'svelte';
	import type { SeedSample } from '$lib/types';

	let seeds: SeedSample[] = [];

	onMount(async () => {
		const res = await fetch('/api/seeds');
		seeds = await res.json();
	});

	function getScenarioLabel(s: string): string {
		if (s === 'normal_completion') return '正常完成';
		if (s === 'material_exception') return '材料异常';
		if (s === 'editor_rollback') return '编辑回滚';
		return s;
	}

	function getScenarioBadge(s: string): string {
		if (s === 'normal_completion') return 'badge-success';
		if (s === 'material_exception') return 'badge-warning';
		if (s === 'editor_rollback') return 'badge-info';
		return 'badge-secondary';
	}

	function formatIntensity(val: number): string {
		return val.toFixed(3);
	}
</script>

<h1 class="page-title">🧪 种子样本</h1>
<p style="color:var(--text-secondary); margin-bottom:24px;">
	三个种子样本覆盖不同场景，展示最佳解记录和失败原因前后的差异，以及专属记录如何影响最终页面。
</p>

<div class="grid grid-1">
	{#each seeds as seed}
		<div class="card seed-card">
			<div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:16px;">
				<div>
					<h3 style="font-size:18px; margin-bottom:4px;">{seed.id}</h3>
					<span class="badge {getScenarioBadge(seed.scenario)}">
						{getScenarioLabel(seed.scenario)}
					</span>
				</div>
				<span style="font-size:12px; color:var(--text-muted);">关卡: {seed.levelId}</span>
			</div>

			<p style="color:var(--text-secondary); font-size:14px; margin-bottom:16px;">
				{seed.description}
			</p>

			<div class="diff-section">
				<h4 style="color:var(--accent); margin-bottom:12px;">📊 前后差异对比</h4>
				<div class="diff-grid">
					<div class="diff-before">
						<h5 style="color:var(--warning); margin-bottom:8px;">操作前</h5>
						<div class="diff-item">
							<span class="diff-label">光强</span>
							<span class="diff-value">{formatIntensity(seed.beforeSnapshot.finalIntensity)}</span>
						</div>
						<div class="diff-item">
							<span class="diff-label">到达目标</span>
							<span class="diff-value">{seed.beforeSnapshot.targetReached ? '✓' : '✗'}</span>
						</div>
						<div class="diff-item">
							<span class="diff-label">状态</span>
							<span class="diff-value">{seed.beforeSnapshot.status}</span>
						</div>
						{#if seed.beforeSnapshot.failureReason}
							<div class="diff-item">
								<span class="diff-label">失败原因</span>
								<span class="diff-value" style="color:var(--danger);">{seed.beforeSnapshot.failureReason}</span>
							</div>
						{/if}
						<div class="diff-item">
							<span class="diff-label">光段数</span>
							<span class="diff-value">{seed.beforeSnapshot.beamSegments.length}</span>
						</div>
						<div class="diff-item">
							<span class="diff-label">操作数</span>
							<span class="diff-value">{seed.beforeSnapshot.actions.length}</span>
						</div>
					</div>

					<div class="diff-arrow">→</div>

					<div class="diff-after">
						<h5 style="color:var(--success); margin-bottom:8px;">操作后</h5>
						<div class="diff-item">
							<span class="diff-label">光强</span>
							<span class="diff-value" style="color:{seed.afterSnapshot.finalIntensity > seed.beforeSnapshot.finalIntensity ? 'var(--success)' : 'var(--danger)'};">
								{formatIntensity(seed.afterSnapshot.finalIntensity)}
							</span>
						</div>
						<div class="diff-item">
							<span class="diff-label">到达目标</span>
							<span class="diff-value" style="color:{seed.afterSnapshot.targetReached ? 'var(--success)' : 'var(--danger)'};">
								{seed.afterSnapshot.targetReached ? '✓' : '✗'}
							</span>
						</div>
						<div class="diff-item">
							<span class="diff-label">状态</span>
							<span class="diff-value">{seed.afterSnapshot.status}</span>
						</div>
						{#if seed.afterSnapshot.failureReason}
							<div class="diff-item">
								<span class="diff-label">失败原因</span>
								<span class="diff-value" style="color:var(--danger);">{seed.afterSnapshot.failureReason}</span>
							</div>
						{/if}
						<div class="diff-item">
							<span class="diff-label">光段数</span>
							<span class="diff-value">{seed.afterSnapshot.beamSegments.length}</span>
						</div>
						<div class="diff-item">
							<span class="diff-label">操作数</span>
							<span class="diff-value">{seed.afterSnapshot.actions.length}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="record-section">
				<h4 style="color:var(--accent); margin-bottom:12px;">📋 专属记录影响</h4>

				<div class="record-grid">
					<div class="record-block">
						<div class="record-title">主记录</div>
						<div class="record-content">
							旋转次数: {seed.gameRecord.mainRecord.totalRotations}<br/>
							玩家: {seed.gameRecord.mainRecord.playerName}
						</div>
					</div>
					<div class="record-block">
						<div class="record-title">明细记录</div>
						<div class="record-content">
							折射次数: {seed.gameRecord.detailRecord.refractionsCount}<br/>
							光段数: {seed.gameRecord.detailRecord.beamPathLength}<br/>
							到达目标: {seed.gameRecord.detailRecord.targetPrismReached ? '✓' : '✗'}
						</div>
					</div>
					<div class="record-block">
						<div class="record-title">历史记录</div>
						<div class="record-content">
							吸收损耗: {seed.gameRecord.historyRecord.totalAbsorptionLoss.toFixed(3)}<br/>
							最弱光强: {seed.gameRecord.historyRecord.weakestSegmentIntensity.toFixed(3)}<br/>
							吸收事件: {seed.gameRecord.historyRecord.absorptionEvents.length}
						</div>
					</div>
					<div class="record-block">
						<div class="record-title">结果记录</div>
						<div class="record-content">
							分数: <strong>{seed.gameRecord.resultRecord.score}</strong><br/>
							状态: {seed.gameRecord.resultRecord.status}<br/>
							{#if seed.gameRecord.resultRecord.failureReason}
								失败原因: <span style="color:var(--danger);">{seed.gameRecord.resultRecord.failureReason}</span><br/>
							{/if}
							光强差额: {seed.gameRecord.resultRecord.intensityDeficit.toFixed(3)}
						</div>
					</div>
				</div>

				<div style="margin-top:12px; padding:8px; background:var(--bg-hover); border-radius:4px; font-size:12px; color:var(--text-secondary);">
					💡 变化原因:
					{#if seed.scenario === 'normal_completion'}
						光束正常通过玻璃折射到达目标，无需旋转操作，所有专属记录均为正值。
					{:else if seed.scenario === 'material_exception'}
						高吸收率材料（重铅玻璃/水晶玻璃）导致光强急剧下降，历史记录中的吸收事件累积使光线过弱无法触发机关，结果记录显示光强差额。
					{:else if seed.scenario === 'editor_rollback'}
						多次旋转尝试后需要回滚重算，主记录保存了所有旋转操作（含回滚），最终旋转组合产生正确光路。
					{/if}
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	.seed-card {
		margin-bottom: 20px;
	}
	.diff-grid {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 16px;
		align-items: start;
	}
	.diff-arrow {
		font-size: 24px;
		color: var(--accent);
		align-self: center;
		padding-top: 24px;
	}
	.diff-before, .diff-after {
		background: var(--bg-hover);
		padding: 12px;
		border-radius: 6px;
	}
	.diff-item {
		display: flex;
		justify-content: space-between;
		padding: 4px 0;
		font-size: 13px;
		border-bottom: 1px solid var(--border);
	}
	.diff-item:last-child {
		border-bottom: none;
	}
	.diff-label {
		color: var(--text-muted);
	}
	.diff-value {
		font-weight: 600;
	}
	.record-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.record-block {
		background: var(--bg-hover);
		padding: 10px;
		border-radius: 6px;
		border-left: 3px solid var(--accent);
	}
	.record-title {
		font-size: 12px;
		font-weight: 600;
		color: var(--accent);
		margin-bottom: 4px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.record-content {
		font-size: 13px;
		color: var(--text-secondary);
	}
	.grid-1 {
		display: grid;
		gap: 0;
	}
</style>
