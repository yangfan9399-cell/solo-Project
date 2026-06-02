<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { CATEGORY_LABELS } from '$lib/types';

	export let data: PageData;
	export let form: ActionData | undefined;

	let selectedHall = '';
	let selectedShowtime = '';

	function onHallChange(e: Event) {
		selectedHall = (e.target as HTMLSelectElement).value;
		selectedShowtime = '';
	}
</script>

<div class="max-w-2xl mx-auto">
	<div class="flex items-center mb-6">
		<a href="/items" class="text-indigo-600 hover:text-indigo-800 mr-4">← 返回</a>
		<h1 class="text-2xl font-bold text-gray-900">拾物登记</h1>
	</div>

	{#if form?.error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
			{form.error}
		</div>
	{/if}

	<form method="POST" class="card space-y-6">
		<div>
			<h2 class="text-lg font-semibold mb-4">基本信息</h2>
			
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						物品名称 <span class="text-red-500">*</span>
					</label>
					<input type="text" name="name" class="form-input" placeholder="例如：黑色钱包" required />
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							物品分类 <span class="text-red-500">*</span>
						</label>
						<select name="category" class="form-select" required>
							<option value="">请选择分类</option>
							{#each Object.entries(CATEGORY_LABELS) as [key, label]}
								<option value={key}>{label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
						<input type="text" name="color" class="form-input" placeholder="例如：黑色" />
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">特征描述</label>
					<input type="text" name="distinguishingFeatures" class="form-input" placeholder="例如：有划痕、品牌标识等" />
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
					<textarea name="description" class="form-input" rows="3" placeholder="请详细描述物品特征..."></textarea>
				</div>
			</div>
		</div>

		<div class="border-t pt-6">
			<h2 class="text-lg font-semibold mb-4">拾获信息</h2>
			
			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">拾获影厅</label>
						<select name="hallId" class="form-select" on:change={onHallChange}>
							<option value="">请选择影厅</option>
							{#each data.halls as hall}
								<option value={hall.id}>{hall.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">关联场次</label>
						<select name="showtimeId" class="form-select" bind:value={selectedShowtime}>
							<option value="">请选择场次</option>
							{#each data.showtimes.filter((s: any) => !selectedHall || s.hall_id == selectedHall) as showtime}
								<option value={showtime.id}>
									{showtime.movie_name} - {new Date(showtime.start_time).toLocaleTimeString()}
								</option>
							{/each}
						</select>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">具体位置</label>
					<input type="text" name="foundLocation" class="form-input" placeholder="例如：3排5座下方" />
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						拾获时间 <span class="text-red-500">*</span>
					</label>
					<input type="datetime-local" name="foundTime" class="form-input" required value={new Date().toISOString().slice(0, 16)} />
				</div>
			</div>
		</div>

		<div class="flex justify-end gap-3 pt-4 border-t">
			<a href="/items" class="btn btn-secondary">取消</a>
			<button type="submit" class="btn btn-primary">提交登记</button>
		</div>
	</form>
</div>
