const FREQUENCY_MIN = 100;
const FREQUENCY_MAX = 1e4;
const GAIN_MIN = 0;
const GAIN_MAX = 100;
const ANTENNA_MIN = 0;
const ANTENNA_MAX = 90;
function calculateSignalQuality(state, level) {
  const freqDiff = Math.abs(state.frequency - level.targetFrequency);
  const freqRange = FREQUENCY_MAX - FREQUENCY_MIN;
  const frequencyMatch = Math.max(0, 1 - freqDiff / (freqRange * 0.1));
  const gainDiff = Math.abs(state.gain - level.targetGain);
  const gainRange = GAIN_MAX - GAIN_MIN;
  const gainMatch = Math.max(0, 1 - gainDiff / (gainRange * 0.15));
  const angleDiff = Math.abs(state.antennaAngle - level.targetAntennaAngle);
  const angleRange = ANTENNA_MAX - ANTENNA_MIN;
  const antennaMatch = Math.max(0, 1 - angleDiff / (angleRange * 0.1));
  const optimalFilter = level.noiseLevel * 0.7;
  const filterDiff = Math.abs(state.noiseFilter - optimalFilter);
  const filterMatch = Math.max(0, 1 - filterDiff / 0.5);
  const overall = frequencyMatch * 0.35 + gainMatch * 0.25 + antennaMatch * 0.25 + filterMatch * 0.15;
  const snr = overall * (1 - level.noiseLevel * 0.5);
  return {
    frequencyMatch,
    gainMatch,
    antennaMatch,
    filterMatch,
    overall,
    snr
  };
}
function calculateDecodeProgress(state, level) {
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
function calculateGameResult(state, level) {
  const quality = calculateSignalQuality(state, level);
  const decodeInfo = calculateDecodeProgress(state, level);
  const frequencyAccuracy = quality.frequencyMatch * 100;
  const gainAccuracy = quality.gainMatch * 100;
  const antennaAccuracy = quality.antennaMatch * 100;
  const decodeProgress = decodeInfo.progress * 100;
  const baseScore = Math.floor(
    frequencyAccuracy * 2 + gainAccuracy * 1.5 + antennaAccuracy * 2 + decodeProgress * 3
  );
  const elapsed = state.endTime ? (state.endTime - state.startTime) / 1e3 : 0;
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
function createInitialGameState(playerId, level) {
  return {
    id: "",
    playerId,
    levelId: level.id,
    status: "playing",
    score: 0,
    startTime: Date.now(),
    frequency: FREQUENCY_MIN + Math.random() * (FREQUENCY_MAX - FREQUENCY_MIN) * 0.5,
    gain: 30 + Math.random() * 40,
    antennaAngle: Math.random() * 45,
    noiseFilter: 0.3,
    decodedChars: "",
    history: [],
    historyIndex: -1
  };
}
export {
  calculateGameResult as a,
  createInitialGameState as c
};
