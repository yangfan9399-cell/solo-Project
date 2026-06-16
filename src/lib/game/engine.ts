import type { Level, GameState, GameResult, GameAction } from '$lib/types/game';

export const FREQUENCY_MIN = 100;
export const FREQUENCY_MAX = 10000;
export const GAIN_MIN = 0;
export const GAIN_MAX = 100;
export const ANTENNA_MIN = 0;
export const ANTENNA_MAX = 90;
export const FILTER_MIN = 0;
export const FILTER_MAX = 1;

export interface SignalQuality {
	frequencyMatch: number;
	gainMatch: number;
	antennaMatch: number;
	filterMatch: number;
	overall: number;
	snr: number;
}

export function calculateSignalQuality(state: GameState, level: Level): SignalQuality {
	const freqDiff = Math.abs(state.frequency - level.targetFrequency);
	const freqRange = FREQUENCY_MAX - FREQUENCY_MIN;
	const frequencyMatch = Math.max(0, 1 - freqDiff / (freqRange * 0.1));

	const gainDiff = Math.abs(state.gain - level.targetGain);
	const gainRange = GAIN_MAX - GAIN_MIN;
	const gainMatch = Math.max(0, 1 - gainDiff / (gainRange * 0.15));

	const angleDiff = Math.abs(state.antennaAngle - level.targetAntennaAngle);
	const angleRange = ANTENNA_MAX - ANTENNA_MIN;
	const antennaMatch = Math.max(0, 1 - angleDiff / (angleRange * 0.1));

	const targetNoiseReduction = Math.min(1, level.noiseLevel * 1.2);
	const actualNoiseReduction = state.noiseFilter;
	const filterEffectiveness = Math.min(actualNoiseReduction, targetNoiseReduction) / targetNoiseReduction;
	const overFiltering = Math.max(0, actualNoiseReduction - targetNoiseReduction) / (1 - targetNoiseReduction + 0.01);
	const filterMatch = Math.max(0, filterEffectiveness - overFiltering * 0.5);

	const overall = frequencyMatch * 0.35 + gainMatch * 0.25 + antennaMatch * 0.25 + filterMatch * 0.15;
	const noiseReduction = state.noiseFilter;
	const effectiveNoise = level.noiseLevel * (1 - noiseReduction);
	const baseSnr = overall * (1 - effectiveNoise * 0.5);
	const snrBoost = Math.pow(overall, 3) * 0.15;
	const snr = Math.min(1, baseSnr + snrBoost);

	return {
		frequencyMatch,
		gainMatch,
		antennaMatch,
		filterMatch,
		overall,
		snr
	};
}

export function generateWaveform(
	state: GameState,
	level: Level,
	sampleCount: number = 200
): number[] {
	const quality = calculateSignalQuality(state, level);
	const waveform: number[] = [];

	const signalFreq = level.targetFrequency / 1000;
	const phase = (state.frequency - level.targetFrequency) * 0.01;

	for (let i = 0; i < sampleCount; i++) {
		const t = i / sampleCount;

		const signal = Math.sin(2 * Math.PI * signalFreq * t + phase) * quality.overall * (state.gain / 100);

		const noiseAmplitude = level.noiseLevel * (1 - state.noiseFilter * 0.8);
		const noise = (Math.random() * 2 - 1) * noiseAmplitude;

		const antennaFactor = 0.5 + 0.5 * Math.cos((state.antennaAngle - level.targetAntennaAngle) * Math.PI / 180);

		const sample = signal * antennaFactor + noise;
		waveform.push(Math.max(-1, Math.min(1, sample)));
	}

	return waveform;
}

export function calculateDecodeProgress(
	state: GameState,
	level: Level
): { decoded: string; progress: number; nextChar: string | null } {
	const quality = calculateSignalQuality(state, level);
	const targetMessage = level.telemetryMessage;

	const maxDecoded = Math.floor(quality.snr * targetMessage.length);
	const decoded = targetMessage.slice(0, maxDecoded);
	const nextChar = maxDecoded < targetMessage.length ? targetMessage[maxDecoded] : null;

	return {
		decoded,
		progress: maxDecoded / targetMessage.length,
		nextChar
	};
}

export function calculateGameResult(
	state: GameState,
	level: Level
): GameResult {
	const quality = calculateSignalQuality(state, level);
	const decodeInfo = calculateDecodeProgress(state, level);

	const frequencyAccuracy = quality.frequencyMatch * 100;
	const gainAccuracy = quality.gainMatch * 100;
	const antennaAccuracy = quality.antennaMatch * 100;
	const decodeProgress = decodeInfo.progress * 100;

	const baseScore = Math.floor(
		frequencyAccuracy * 2 +
		gainAccuracy * 1.5 +
		antennaAccuracy * 2 +
		decodeProgress * 3
	);

	const elapsed = state.endTime ? (state.endTime - state.startTime) / 1000 : 0;
	const timeRatio = Math.max(0, 1 - elapsed / level.timeLimit);
	const timeBonus = Math.floor(timeRatio * level.parScore * 0.3);

	const levelBonus = Math.floor(level.parScore * 0.2 * level.difficulty);

	const score = baseScore + timeBonus + levelBonus;

	const won = decodeProgress >= 95 && quality.overall >= 0.8;

	return {
		won,
		score,
		frequencyAccuracy,
		gainAccuracy,
		antennaAccuracy,
		decodeProgress,
		timeBonus,
		levelBonus
	};
}

export function createInitialGameState(playerId: string, level: Level): GameState {
	return {
		id: '',
		playerId,
		levelId: level.id,
		status: 'playing',
		score: 0,
		startTime: Date.now(),
		frequency: FREQUENCY_MIN + Math.random() * (FREQUENCY_MAX - FREQUENCY_MIN) * 0.5,
		gain: 30 + Math.random() * 40,
		antennaAngle: Math.random() * 45,
		noiseFilter: 0.3,
		decodedChars: '',
		history: [],
		historyIndex: -1
	};
}

export function pushHistory(state: GameState, action: GameAction): GameState {
	const newHistory = state.history.slice(0, state.historyIndex + 1);
	newHistory.push(action);
	return {
		...state,
		history: newHistory,
		historyIndex: newHistory.length - 1
	};
}

export function undoAction(state: GameState, level: Level): GameState {
	if (state.historyIndex < 0) return state;

	const action = state.history[state.historyIndex];
	let newState = { ...state, historyIndex: state.historyIndex - 1 };

	switch (action.type) {
		case 'frequency':
			newState.frequency = action.from as number;
			break;
		case 'gain':
			newState.gain = action.from as number;
			break;
		case 'antenna':
			newState.antennaAngle = action.from as number;
			break;
		case 'filter':
			newState.noiseFilter = action.from as number;
			break;
		case 'decode':
			newState.decodedChars = action.from as string;
			break;
		case 'reset':
			break;
	}

	const decodeInfo = calculateDecodeProgress(newState, level);
	newState.decodedChars = decodeInfo.decoded;

	return newState;
}

export function redoAction(state: GameState, level: Level): GameState {
	if (state.historyIndex >= state.history.length - 1) return state;

	const action = state.history[state.historyIndex + 1];
	let newState = { ...state, historyIndex: state.historyIndex + 1 };

	switch (action.type) {
		case 'frequency':
			newState.frequency = action.to as number;
			break;
		case 'gain':
			newState.gain = action.to as number;
			break;
		case 'antenna':
			newState.antennaAngle = action.to as number;
			break;
		case 'filter':
			newState.noiseFilter = action.to as number;
			break;
		case 'decode':
			newState.decodedChars = action.to as string;
			break;
		case 'reset':
			break;
	}

	const decodeInfo = calculateDecodeProgress(newState, level);
	newState.decodedChars = decodeInfo.decoded;

	return newState;
}
