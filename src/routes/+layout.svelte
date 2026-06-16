<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { getLocalPlayerId, setLocalPlayerId, playersApi } from '$lib/client/api';
	import type { PlayerProfile } from '$lib/types/game';
	import { goto } from '$app/navigation';

	let currentPlayer: PlayerProfile | null = null;
	let showProfileModal = false;
	let playerName = '';
	let playerAvatar = '🚇';
	let isLoading = true;

	const avatars = ['🚇', '🚉', '🚈', '🚝', '🚄', '🚅', '🎮', '🎯', '🏆', '⭐'];

	onMount(async () => {
		const id = getLocalPlayerId();
		if (id) {
			const { player } = await playersApi.get(id);
			currentPlayer = player;
		}
		isLoading = false;
	});

	async function createPlayer() {
		if (!playerName.trim()) return;
		const { player } = await playersApi.create(playerName, playerAvatar);
		currentPlayer = player;
		setLocalPlayerId(player.id);
		showProfileModal = false;
		playerName = '';
	}

	function logout() {
		currentPlayer = null;
		setLocalPlayerId(null);
	}

	async function goToLevels() {
		if (!currentPlayer) {
			showProfileModal = true;
			return;
		}
		goto('/levels');
	}
</script>

<header class="app-header">
	<div class="header-content container flex justify-between items-center">
		<div class="flex items-center gap-3" style="cursor: pointer;" on:click={() => goto('/')}>
			<span class="logo">🚇</span>
			<div>
				<h1 class="title">地铁换乘迷宫</h1>
				<p class="subtitle text-sm text-muted">限时策略游戏</p>
			</div>
		</div>

		<div class="flex items-center gap-3">
			{#if isLoading}
				<div class="text-muted">加载中...</div>
			{:else if currentPlayer}
				<div class="player-info flex items-center gap-2">
					<span class="avatar">{currentPlayer.avatar}</span>
					<div>
						<div class="font-medium">{currentPlayer.name}</div>
						<div class="text-xs text-muted">胜场 {currentPlayer.totalWins}/{currentPlayer.totalGames}</div>
					</div>
					<button class="btn-secondary text-sm" on:click={logout}>切换</button>
				</div>
			{:else}
				<button class="btn-primary" on:click={() => (showProfileModal = true)}>创建玩家</button>
			{/if}
		</div>
	</div>
</header>

<main>
	<slot />
</main>

{#if showProfileModal}
	<div class="modal-overlay" on:click={() => (showProfileModal = false)}>
		<div class="modal card" on:click|stopPropagation>
			<h2 class="text-xl font-bold mb-4">创建玩家档案</h2>
			<div class="flex flex-col gap-4">
				<div>
					<label class="block mb-2 text-sm">玩家昵称</label>
					<input
						bind:value={playerName}
						placeholder="输入你的昵称"
						maxlength={20}
						style="width: 100%;"
					/>
				</div>
				<div>
					<label class="block mb-2 text-sm">选择头像</label>
					<div class="flex gap-2 flex-wrap">
						{#each avatars as a}
							<button
								class="avatar-btn {playerAvatar === a ? 'selected' : ''}"
								on:click={() => (playerAvatar = a)}
							>
								{a}
							</button>
						{/each}
					</div>
				</div>
				<div class="flex gap-3 justify-end mt-2">
					<button class="btn-secondary" on:click={() => (showProfileModal = false)}>取消</button>
					<button class="btn-primary" on:click={createPlayer} disabled={!playerName.trim()}>开始游戏</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.app-header {
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
		padding: 12px 0;
	}

	.logo {
		font-size: 32px;
	}

	.title {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
	}

	.subtitle {
		margin: 2px 0 0 0;
	}

	.player-info {
		background: var(--bg-card);
		padding: 8px 12px;
		border-radius: 8px;
	}

	.avatar {
		font-size: 28px;
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.modal {
		width: 90%;
		max-width: 420px;
	}

	.avatar-btn {
		width: 48px;
		height: 48px;
		font-size: 24px;
		background: var(--bg-card);
		border: 2px solid transparent;
		border-radius: 10px;
		padding: 0;
	}

	.avatar-btn.selected {
		border-color: var(--accent);
		background: rgba(59, 130, 246, 0.1);
	}
</style>
