import type { GameEvent, LevelConfig } from '../types/game';

export function getDifficultyLabel(difficulty: LevelConfig['difficulty']): string {
	switch (difficulty) {
		case 'easy':
			return '简单';
		case 'medium':
			return '中等';
		case 'hard':
			return '困难';
	}
}

export function getDifficultyStars(difficulty: LevelConfig['difficulty']): string {
	switch (difficulty) {
		case 'easy':
			return '⭐';
		case 'medium':
			return '⭐⭐';
		case 'hard':
			return '⭐⭐⭐';
	}
}

export function getDifficultyTagClass(difficulty: LevelConfig['difficulty']): string {
	return `tag-${difficulty}`;
}

export function getEventTypeName(type: GameEvent['type']): string {
	switch (type) {
		case 'ESCALATOR_DOWN':
			return '扶梯故障';
		case 'STATION_CLOSED':
			return '封站';
		case 'DELAY':
			return '延误';
	}
}

export function formatTime(seconds: number): string {
	return `${seconds} 秒`;
}

export function formatTimeLong(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatTransferCount(count: number): string {
	return `${count} 次`;
}
