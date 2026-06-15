<script lang="ts">
	import { onMount } from 'svelte';
	import type { GameRecord, BestSolution } from '$lib/types';

	let records: GameRecord[] = [];
	let bestSolutions: BestSolution[] = [];
	let selectedRecord: GameRecord | null = null;
	let tab: 'records' | 'best' = 'records';

	onMount(async () => {
		const [rRes, bRes] = await Promise.all([
			fetch('/api/records'),
			fetch('/api/best-solutions')
		]);
		records = await rRes.json();
		bestSolutions = await bRes.json();
	});

	async function loadRecordDetail(id: string) {
		const res = await fetch(`/api/records/${id}`);
		if (res.ok) {
			selectedRecord = await res.json();
		}
	}
</script>

<h1 class="page-title">📊 记录与排行</h1>

<div style="display:flex; gap:8px; margin-bottom:24px;">
	<button
		class="btn {tab === 'records' ? 'btn-primary' : 'btn-secondary'}"
		on:click={() => tab = 'records'}
	>
		对局记录
	</button>
	<button
		class="btn {tab === 'best' ? 'btn-primary' : 'btn-secondary'}"
		on:click={() => tab = 'best'}
	>
		最佳解法
	</button>
</div>

{#if tab === 'records'}
	<div class="results-layout">
		<div class="card" style="overflow-x:auto;">
			<h3 style="margin-bottom:12px;">对局记录 ({records.length})</h3>
			{#if records.length > 0}
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>关卡</th>
							<th>结果</th>
							<th>旋转次数</th>
							<th>最终光强</th>
							<th>吸收损耗</th>
							<th>分数</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each records as record}
							<tr>
								<td style="font-size:12px; font-family:monospace;">{record.id.slice(0, 16)}…</td>
								<td>{record.levelId}</td>
								<td>
									<span class="badge {record.resultRecord.status === 'won' ? 'badge-success' : 'badge-danger'}">
										{record.resultRecord.status === 'won' ? '胜利' : '失败'}
									</span>
								</td>
								<td>{record.mainRecord.totalRotations}</td>
								<td>{record.detailRecord.finalBeamIntensity.toFixed(3)}</td>
								<td>{record.historyRecord.totalAbsorptionLoss.toFixed(3)}</td>
								<td style="font-weight:700; color:{record.resultRecord.score > 0 ? 'var(--success)' : 'var(--danger)'};">
									{record.resultRecord.score}
								</td>
								<td>
									<button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" on:click={() => loadRecordDetail(record.id)}>
										详情
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<p style="color:var(--text-muted); font-size:14px;">暂无对局记录</p>
			{/if}
		</div>

		{#if selectedRecord}
			<div class="card detail-card">
				<h3 style="margin-bottom:12px;">📋 对局详情</h3>

				<div style="margin-bottom:16px;">
					<h4 style="color:var(--accent); margin-bottom:8px;">主记录 — 玩家旋转操作</h4>
					<div style="font-size:13px;">
						<div>玩家: {selectedRecord.mainRecord.playerName}</div>
						<div>总旋转次数: {selectedRecord.mainRecord.totalRotations}</div>
						{#each selectedRecord.mainRecord.rotationDetails as action, i}
							<div style="padding:4px 0; color:var(--text-secondary);">
								#{i + 1} {action.glassBlockId}: {action.previousRotation}° → {action.newRotation}°
								<span style="color:var(--text-muted);">(Δ{action.rotationDelta}°)</span>
							</div>
						{/each}
					</div>
				</div>

				<div style="margin-bottom:16px;">
					<h4 style="color:var(--success); margin-bottom:8px;">明细记录 — 光束引导情况</h4>
					<div style="font-size:13px;">
						<div>光路段数: {selectedRecord.detailRecord.beamPathLength}</div>
						<div>折射次数: {selectedRecord.detailRecord.refractionsCount}</div>
						<div>到达目标: {selectedRecord.detailRecord.targetPrismReached ? '✓ 是' : '✗ 否'}</div>
						<div>最终光强: {selectedRecord.detailRecord.finalBeamIntensity.toFixed(3)}</div>
					</div>
				</div>

				<div style="margin-bottom:16px;">
					<h4 style="color:var(--warning); margin-bottom:8px;">历史记录 — 吸收损耗</h4>
					<div style="font-size:13px;">
						<div>吸收事件数: {selectedRecord.historyRecord.absorptionEvents.length}</div>
						<div>总吸收损耗: {selectedRecord.historyRecord.totalAbsorptionLoss.toFixed(3)}</div>
						<div>最弱段光强: {selectedRecord.historyRecord.weakestSegmentIntensity.toFixed(3)}</div>
						{#each selectedRecord.historyRecord.absorptionEvents as event, i}
							<div style="padding:4px 0; color:var(--text-secondary);">
								#{i + 1} {event.materialId} @ ({event.gridPosition.x},{event.gridPosition.y}):
								{event.inputIntensity.toFixed(3)} → {event.outputIntensity.toFixed(3)}
								<span style="color:var(--danger);">(-{event.absorptionLoss.toFixed(3)})</span>
							</div>
						{/each}
					</div>
				</div>

				<div>
					<h4 style="color:{selectedRecord.resultRecord.status === 'won' ? 'var(--success)' : 'var(--danger)'}; margin-bottom:8px;">
						结果记录 — 最终结果
					</h4>
					<div style="font-size:13px;">
						<div>分数: <strong style="font-size:18px;">{selectedRecord.resultRecord.score}</strong></div>
						<div>状态: {selectedRecord.resultRecord.status === 'won' ? '✓ 胜利' : '✗ 失败'}</div>
						<div>目标处光强: {selectedRecord.resultRecord.intensityAtTarget.toFixed(3)}</div>
						<div>所需光强: {selectedRecord.resultRecord.requiredIntensity.toFixed(3)}</div>
						{#if selectedRecord.resultRecord.intensityDeficit > 0}
							<div style="color:var(--danger);">
								光强差额: {selectedRecord.resultRecord.intensityDeficit.toFixed(3)}
							</div>
						{/if}
						{#if selectedRecord.resultRecord.failureReason}
							<div style="margin-top:8px; padding:8px; background:#7f1d1d33; border-radius:4px; color:#fca5a5;">
								⚠ {selectedRecord.resultRecord.failureReason}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="card" style="overflow-x:auto;">
		<h3 style="margin-bottom:12px;">🏆 最佳解法</h3>
		{#if bestSolutions.length > 0}
			<table>
				<thead>
					<tr>
						<th>关卡</th>
						<th>分数</th>
						<th>旋转步数</th>
						<th>达成者</th>
						<th>达成时间</th>
					</tr>
				</thead>
				<tbody>
					{#each bestSolutions as best}
						<tr>
							<td>{best.levelId}</td>
							<td style="font-weight:700; color:var(--success);">{best.score}</td>
							<td>{best.rotationCount}</td>
							<td>{best.achievedBy}</td>
							<td style="font-size:12px; color:var(--text-muted);">{new Date(best.achievedAt).toLocaleString()}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p style="color:var(--text-muted); font-size:14px;">暂无最佳解法记录</p>
		{/if}
	</div>
{/if}

<style>
	.results-layout {
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: 16px;
	}
	.detail-card {
		max-height: 600px;
		overflow-y: auto;
	}

	@media (max-width: 900px) {
		.results-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
