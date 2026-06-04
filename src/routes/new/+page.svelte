<script lang="ts">
	import { goto } from '$app/navigation';

	let prescriptionNo = `RX${Date.now().toString().slice(-8)}`;
	let source = 'HOSPITAL';
	let sourceHospital = '';
	let doctorName = '';
	let department = '';
	let diagnosis = '';

	let patientName = '';
	let patientIdCard = '';
	let patientPhone = '';
	let patientGender = '';

	let medicines: Array<{
		name: string;
		specification: string;
		dosage: string;
		frequency: string;
		quantity: number;
		unit: string;
		notes: string;
	}> = [{
		name: '',
		specification: '',
		dosage: '',
		frequency: '',
		quantity: 1,
		unit: '盒',
		notes: ''
	}];

	let submitting = false;
	let error = '';

	function addMedicine() {
		medicines = [...medicines, {
			name: '',
			specification: '',
			dosage: '',
			frequency: '',
			quantity: 1,
			unit: '盒',
			notes: ''
		}];
	}

	function removeMedicine(index: number) {
		if (medicines.length > 1) {
			medicines = medicines.filter((_, i) => i !== index);
		}
	}

	async function submitPrescription() {
		if (!patientName || !patientIdCard) {
			error = '请填写患者姓名和身份证号';
			return;
		}

		const validMedicines = medicines.filter(m => m.name);
		if (validMedicines.length === 0) {
			error = '请至少添加一种药品';
			return;
		}

		submitting = true;
		error = '';

		try {
			const res = await fetch('/api/prescriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					prescriptionNo,
					source,
					sourceHospital,
					doctorName,
					department,
					diagnosis,
					patient: {
						name: patientName,
						idCard: patientIdCard,
						phone: patientPhone,
						gender: patientGender
					},
					medicines: validMedicines
				})
			});

			if (res.ok) {
				const data = await res.json();
				goto(`/prescription/${data.id}`);
			} else {
				const data = await res.json();
				error = data.error || '提交失败';
			}
		} catch (e) {
			error = '网络错误，请重试';
		} finally {
			submitting = false;
		}
	}

	const sourceOptions = [
		{ value: 'HOSPITAL', label: '医院' },
		{ value: 'CLINIC', label: '诊所' },
		{ value: 'ONLINE', label: '线上' },
		{ value: 'EXTERNAL', label: '外部机构' }
	];

	const unitOptions = ['盒', '瓶', '片', '粒', '袋', '支', '毫升', '毫克'];
</script>

<div class="max-w-4xl mx-auto">
	<div class="mb-6">
		<h2 class="text-2xl font-bold text-gray-900">接收新处方</h2>
		<p class="text-gray-500 mt-1">录入处方信息并接收</p>
	</div>

	{#if error}
		<div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
			{error}
		</div>
	{/if}

	<form on:submit|preventDefault={submitPrescription} class="space-y-6">
		<div class="bg-white shadow-sm rounded-lg border p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">处方基本信息</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">处方编号</label>
					<input
						type="text"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
						bind:value={prescriptionNo}
						readonly
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">处方来源 *</label>
					<select
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						bind:value={source}
					>
						{#each sourceOptions as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">来源医院/机构</label>
					<input
						type="text"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						bind:value={sourceHospital}
						placeholder="如：市第一人民医院"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">医生姓名</label>
					<input
						type="text"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						bind:value={doctorName}
						placeholder="开方医生姓名"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">科室</label>
					<input
						type="text"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						bind:value={department}
						placeholder="如：内科"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">诊断</label>
					<input
						type="text"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						bind:value={diagnosis}
						placeholder="诊断结果"
					/>
				</div>
			</div>
		</div>

		<div class="bg-white shadow-sm rounded-lg border p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">患者信息</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">患者姓名 *</label>
					<input
						type="text"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						bind:value={patientName}
						placeholder="请输入患者姓名"
						required
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">身份证号 *</label>
					<input
						type="text"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						bind:value={patientIdCard}
						placeholder="请输入身份证号"
						required
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
					<input
						type="tel"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						bind:value={patientPhone}
						placeholder="联系电话"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">性别</label>
					<select
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						bind:value={patientGender}
					>
						<option value="">请选择</option>
						<option value="男">男</option>
						<option value="女">女</option>
					</select>
				</div>
			</div>
		</div>

		<div class="bg-white shadow-sm rounded-lg border p-6">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-gray-900">药品清单</h3>
				<button
					type="button"
					on:click={addMedicine}
					class="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
				>
					+ 添加药品
				</button>
			</div>

			<div class="space-y-4">
				{#each medicines as med, index}
					<div class="p-4 bg-gray-50 rounded-lg border">
						<div class="flex items-center justify-between mb-3">
							<span class="font-medium text-gray-700">药品 {index + 1}</span>
							{#if medicines.length > 1}
								<button
									type="button"
									on:click={() => removeMedicine(index)}
									class="text-red-500 hover:text-red-700 text-sm"
								>
									删除
								</button>
							{/if}
						</div>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
							<div class="md:col-span-2">
								<label class="block text-xs font-medium text-gray-500 mb-1">药品名称 *</label>
								<input
									type="text"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									bind:value={med.name}
									placeholder="药品名称"
								/>
							</div>
							<div>
								<label class="block text-xs font-medium text-gray-500 mb-1">规格</label>
								<input
									type="text"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									bind:value={med.specification}
									placeholder="如：10mg*14片"
								/>
							</div>
							<div>
								<label class="block text-xs font-medium text-gray-500 mb-1">剂量</label>
								<input
									type="text"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									bind:value={med.dosage}
									placeholder="如：每次1片"
								/>
							</div>
							<div>
								<label class="block text-xs font-medium text-gray-500 mb-1">频次</label>
								<input
									type="text"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									bind:value={med.frequency}
									placeholder="如：每日3次"
								/>
							</div>
							<div>
								<label class="block text-xs font-medium text-gray-500 mb-1">数量</label>
								<input
									type="number"
									min="0"
									step="0.5"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									bind:value={med.quantity}
								/>
							</div>
							<div>
								<label class="block text-xs font-medium text-gray-500 mb-1">单位</label>
								<select
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									bind:value={med.unit}
								>
									{#each unitOptions as unit}
										<option value={unit}>{unit}</option>
									{/each}
								</select>
							</div>
							<div class="md:col-span-2">
								<label class="block text-xs font-medium text-gray-500 mb-1">备注</label>
								<input
									type="text"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									bind:value={med.notes}
									placeholder="服用注意事项等"
								/>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="flex justify-end gap-3">
			<button
				type="button"
				on:click={() => goto('/')}
				class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
			>
				取消
			</button>
			<button
				type="submit"
				disabled={submitting}
				class="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{submitting ? '提交中...' : '接收处方'}
			</button>
		</div>
	</form>
</div>
