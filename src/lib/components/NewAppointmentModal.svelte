<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	type Student = { id: number; name: string };
	type Course = { id: number; name: string };
	type Teacher = { id: number; name: string };

	let students: Student[] = [];
	let courses: Course[] = [];
	let teachers: Teacher[] = [];
	let loading = false;

	let selectedStudent = '';
	let selectedCourse = '';
	let selectedTeacher = '';
	let scheduledAt = '';
	let notes = '';
	let newStudentName = '';
	let newStudentPhone = '';
	let newStudentAge = '';
	let newStudentParent = '';
	let newStudentSource = 'wechat';
	let showNewStudent = false;

	onMount(async () => {
		const [studentsRes, coursesRes, teachersRes] = await Promise.all([
			fetch('/api/students'),
			fetch('/api/courses'),
			fetch('/api/teachers')
		]);

		const studentsData = await studentsRes.json();
		students = studentsData.map((s: any) => s.student);
		courses = await coursesRes.json();
		teachers = await teachersRes.json();
	});

	async function createNewStudent() {
		if (!newStudentName || !newStudentPhone) return;

		const res = await fetch('/api/students', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: newStudentName,
				phone: newStudentPhone,
				age: newStudentAge ? parseInt(newStudentAge) : null,
				parentName: newStudentParent,
				sourceChannel: newStudentSource
			})
		});

		if (res.ok) {
			const newStudent = await res.json();
			students = [...students, newStudent];
			selectedStudent = newStudent.id.toString();
			showNewStudent = false;
			newStudentName = '';
			newStudentPhone = '';
		}
	}

	async function submit() {
		if (!selectedStudent || !selectedCourse) return;

		loading = true;

		const res = await fetch('/api/appointments', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				studentId: parseInt(selectedStudent),
				courseId: parseInt(selectedCourse),
				teacherId: selectedTeacher ? parseInt(selectedTeacher) : null,
				scheduledAt: scheduledAt || null,
				notes
			})
		});

		loading = false;

		if (res.ok) {
			dispatch('success');
		}
	}
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	<div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
		<div class="px-6 py-4 border-b border-slate-200">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-medium text-slate-900">新建预约</h3>
				<button on:click={() => dispatch('close')} class="text-slate-400 hover:text-slate-600">
					✕
				</button>
			</div>
		</div>

		<div class="px-6 py-4 space-y-4">
			{#if showNewStudent}
				<div class="space-y-3 p-4 bg-slate-50 rounded-lg">
					<h4 class="font-medium text-sm text-slate-700">添加新学员</h4>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="block text-xs text-slate-600 mb-1">姓名 *</label>
							<input
								type="text"
								bind:value={newStudentName}
								class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
								placeholder="学员姓名"
							/>
						</div>
						<div>
							<label class="block text-xs text-slate-600 mb-1">电话 *</label>
							<input
								type="tel"
								bind:value={newStudentPhone}
								class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
								placeholder="联系电话"
							/>
						</div>
						<div>
							<label class="block text-xs text-slate-600 mb-1">年龄</label>
							<input
								type="number"
								bind:value={newStudentAge}
								class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
								placeholder="年龄"
							/>
						</div>
						<div>
							<label class="block text-xs text-slate-600 mb-1">家长姓名</label>
							<input
								type="text"
								bind:value={newStudentParent}
								class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
								placeholder="家长姓名"
							/>
						</div>
					</div>
					<div>
						<label class="block text-xs text-slate-600 mb-1">来源渠道</label>
						<select
							bind:value={newStudentSource}
							class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
						>
							<option value="wechat">微信</option>
							<option value="douyin">抖音</option>
							<option value="baidu">百度</option>
							<option value="referral">转介绍</option>
							<option value="walk_in">门店到访</option>
							<option value="other">其他</option>
						</select>
					</div>
					<div class="flex space-x-2">
						<button
							on:click={createNewStudent}
							class="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700"
						>
							确认添加
						</button>
						<button
							on:click={() => (showNewStudent = false)}
							class="px-4 py-2 border border-slate-300 rounded text-sm hover:bg-slate-50"
						>
							取消
						</button>
					</div>
				</div>
			{:else}
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">选择学员</label>
					<div class="flex space-x-2">
						<select
							bind:value={selectedStudent}
							class="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
						>
							<option value="">请选择学员</option>
							{#each students as student}
								<option value={student.id}>{student.name} - {student.phone}</option>
							{/each}
						</select>
						<button
							on:click={() => (showNewStudent = true)}
							class="px-3 py-2 border border-slate-300 rounded text-sm hover:bg-slate-50"
						>
							+ 新学员
						</button>
					</div>
				</div>
			{/if}

			<div>
				<label class="block text-sm font-medium text-slate-700 mb-1">选择课程 *</label>
				<select
					bind:value={selectedCourse}
					class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
				>
					<option value="">请选择课程</option>
					{#each courses as course}
						<option value={course.id}>{course.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-sm font-medium text-slate-700 mb-1">选择老师（可选）</label>
				<select
					bind:value={selectedTeacher}
					class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
				>
					<option value="">暂不指定</option>
					{#each teachers as teacher}
						<option value={teacher.id}>{teacher.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-sm font-medium text-slate-700 mb-1">预约时间（可选）</label>
				<input
					type="datetime-local"
					bind:value={scheduledAt}
					class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-slate-700 mb-1">备注</label>
				<textarea
					bind:value={notes}
					class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
					rows="3"
					placeholder="备注信息..."
				/>
			</div>
		</div>

		<div class="px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
			<button
				on:click={() => dispatch('close')}
				class="px-4 py-2 border border-slate-300 rounded text-sm hover:bg-slate-50"
			>
				取消
			</button>
			<button
				on:click={submit}
				disabled={loading || !selectedStudent || !selectedCourse}
				class="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
			>
				{loading ? '创建中...' : '创建预约'}
			</button>
		</div>
	</div>
</div>