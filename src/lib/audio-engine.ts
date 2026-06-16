import type { PipeStop } from "~/lib/types";

export type StopType = "principal" | "flute" | "string" | "reed" | "mixture";

export interface StopToneConfig {
  type: OscillatorType;
  harmonicCount: number;
  harmonicWeights: number[];
  detune: number;
  gain: number;
  attack: number;
  release: number;
  chorusAmount: number;
}

const STOP_TONE_CONFIGS: Record<StopType, StopToneConfig> = {
  principal: {
    type: "sawtooth",
    harmonicCount: 8,
    harmonicWeights: [1, 0.5, 0.33, 0.25, 0.2, 0.16, 0.14, 0.12],
    detune: 0,
    gain: 0.15,
    attack: 0.02,
    release: 0.3,
    chorusAmount: 2,
  },
  flute: {
    type: "sine",
    harmonicCount: 3,
    harmonicWeights: [1, 0.15, 0.05],
    detune: 0,
    gain: 0.2,
    attack: 0.05,
    release: 0.4,
    chorusAmount: 1,
  },
  string: {
    type: "sawtooth",
    harmonicCount: 6,
    harmonicWeights: [1, 0.6, 0.4, 0.25, 0.15, 0.1],
    detune: 3,
    gain: 0.12,
    attack: 0.03,
    release: 0.35,
    chorusAmount: 3,
  },
  reed: {
    type: "square",
    harmonicCount: 10,
    harmonicWeights: [1, 0.8, 0.6, 0.45, 0.35, 0.28, 0.22, 0.18, 0.15, 0.12],
    detune: 5,
    gain: 0.1,
    attack: 0.015,
    release: 0.25,
    chorusAmount: 1,
  },
  mixture: {
    type: "sine",
    harmonicCount: 5,
    harmonicWeights: [0.8, 0.7, 0.6, 0.5, 0.4],
    detune: 0,
    gain: 0.08,
    attack: 0.01,
    release: 0.5,
    chorusAmount: 4,
  },
};

export function getStopToneConfig(stop: PipeStop): StopToneConfig {
  const base = STOP_TONE_CONFIGS[stop.type];
  const octaveMultiplier = 1;
  return {
    ...base,
    gain: base.gain / stop.rank,
  };
}

export function midiToFrequency(midi: number, octaveOffset: number = 0): number {
  return 440 * Math.pow(2, (midi - 69 + octaveOffset * 12) / 12);
}

export function pitchToOctaveOffset(pitch: string): number {
  switch (pitch) {
    case "32'":
      return -12;
    case "16'":
      return -7;
    case "8'":
      return 0;
    case "4'":
      return 7;
    case "2'":
      return 14;
    case "1'":
      return 21;
    case "2 2/3'":
      return 10;
    case "1 3/5'":
      return 16;
    default:
      return 0;
  }
}

export class OrganAudioEngine {
  private audioContext: AudioContext | null = null;
  private activeOscillators: Map<string, { osc: OscillatorNode[]; gain: GainNode }> = new Map();
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.5;

    await this.createReverb();

    this.masterGain.connect(this.reverbNode!);
    this.reverbNode!.connect(this.audioContext.destination);

    this.isInitialized = true;
  }

  private async createReverb(): Promise<void> {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * 2.5;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    this.reverbNode = this.audioContext.createConvolver();
    this.reverbNode.buffer = impulse;
  }

  resume(): void {
    if (this.audioContext?.state === "suspended") {
      this.audioContext.resume();
    }
  }

  playNote(midi: number, stops: PipeStop[]): void {
    if (!this.audioContext || !this.masterGain) return;
    if (stops.length === 0) return;

    this.stopNote(midi);

    const noteGain = this.audioContext.createGain();
    noteGain.gain.setValueAtTime(0, this.audioContext.currentTime);

    const oscillators: OscillatorNode[] = [];

    for (const stop of stops) {
      const config = getStopToneConfig(stop);
      const octaveOffset = pitchToOctaveOffset(stop.pitch);
      const baseFreq = midiToFrequency(midi, octaveOffset);

      const numVoices = stop.rank;

      for (let voice = 0; voice < numVoices; voice++) {
        for (let h = 0; h < config.harmonicCount; h++) {
          const osc = this.audioContext.createOscillator();
          osc.type = config.type;

          const harmonicFreq = baseFreq * (h + 1);
          const voiceDetune = (voice - numVoices / 2) * config.chorusAmount;
          const totalDetune = config.detune + voiceDetune;

          osc.frequency.value = harmonicFreq;
          osc.detune.value = totalDetune;

          const oscGain = this.audioContext.createGain();
          const weight = config.harmonicWeights[h] || 0;
          const voiceGain = config.gain * weight * (1 / Math.sqrt(numVoices));
          oscGain.gain.value = voiceGain;

          osc.connect(oscGain);
          oscGain.connect(noteGain);

          osc.start();
          oscillators.push(osc);
        }
      }
    }

    const now = this.audioContext.currentTime;
    const avgAttack = stops.reduce((sum, s) => sum + STOP_TONE_CONFIGS[s.type].attack, 0) / stops.length;
    noteGain.gain.linearRampToValueAtTime(1, now + avgAttack);

    noteGain.connect(this.masterGain);

    this.activeOscillators.set(`midi_${midi}`, { osc: oscillators, gain: noteGain });
  }

  stopNote(midi: number): void {
    if (!this.audioContext) return;

    const key = `midi_${midi}`;
    const active = this.activeOscillators.get(key);
    if (!active) return;

    const now = this.audioContext.currentTime;
    active.gain.gain.cancelScheduledValues(now);
    active.gain.gain.setValueAtTime(active.gain.gain.value, now);
    active.gain.gain.linearRampToValueAtTime(0, now + 0.3);

    setTimeout(() => {
      active.osc.forEach((o) => {
        try {
          o.stop();
        } catch (_e) {
          // ignore
        }
      });
      this.activeOscillators.delete(key);
    }, 350);
  }

  playPhrase(midis: number[], stops: PipeStop[], noteDuration: number = 0.4): Promise<void> {
    return new Promise((resolve) => {
      if (midis.length === 0) {
        resolve();
        return;
      }

      let index = 0;

      const playNext = () => {
        if (index >= midis.length) {
          setTimeout(resolve, noteDuration * 1000);
          return;
        }

        this.playNote(midis[index], stops);

        setTimeout(() => {
          this.stopNote(midis[index]);
          index++;
          setTimeout(playNext, 50);
        }, noteDuration * 1000);
      };

      playNext();
    });
  }

  playChord(midis: number[], stops: PipeStop[], duration: number = 1): Promise<void> {
    return new Promise((resolve) => {
      midis.forEach((m) => this.playNote(m, stops));

      setTimeout(() => {
        midis.forEach((m) => this.stopNote(m));
        setTimeout(resolve, 300);
      }, duration * 1000);
    });
  }

  stopAll(): void {
    for (const [key] of this.activeOscillators) {
      const midi = parseInt(key.split("_")[1]);
      this.stopNote(midi);
    }
  }

  getContextState(): string {
    return this.audioContext?.state || "closed";
  }

  destroy(): void {
    this.stopAll();
    setTimeout(() => {
      this.audioContext?.close();
      this.audioContext = null;
      this.isInitialized = false;
    }, 400);
  }
}

let audioEngine: OrganAudioEngine | null = null;

export function getAudioEngine(): OrganAudioEngine {
  if (!audioEngine) {
    audioEngine = new OrganAudioEngine();
  }
  return audioEngine;
}
