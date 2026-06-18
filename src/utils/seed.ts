import { isBrowser } from '@builder.io/qwik';
import type { Project, Sample, Batch, VersionSnapshot, Anomaly } from '../types';
import {
  saveProject,
  saveBatch,
  saveSample,
  saveVersion,
  saveAnomaly,
} from './storage';

function uid(): string {
  return crypto.randomUUID();
}

function generateWaveform(points: number, amplitude: number): number[] {
  const data: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / points;
    data.push(
      Math.sin(t * Math.PI * 2 * 3) * amplitude * (1 - t * 0.3) +
        Math.sin(t * Math.PI * 2 * 7) * amplitude * 0.3 * (1 - t * 0.5)
    );
  }
  return data;
}

function generatePitch(toneValue: string, points: number): number[] {
  const digits = toneValue.split('').map(Number);
  const avg = digits.reduce((a, b) => a + b, 0) / digits.length;
  const base = avg * 40 + 50;
  const data: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    let pitch = base;
    if (digits.length === 1) {
      pitch = base;
    } else if (digits.length === 2) {
      const start = digits[0] * 40 + 50;
      const end = digits[1] * 40 + 50;
      pitch = start + (end - start) * t;
    } else if (digits.length === 3) {
      const start = digits[0] * 40 + 50;
      const mid = digits[1] * 40 + 50;
      const end = digits[2] * 40 + 50;
      if (t < 0.5) {
        pitch = start + (mid - start) * (t / 0.5);
      } else {
        pitch = mid + (end - mid) * ((t - 0.5) / 0.5);
      }
    }
    data.push(Math.round(pitch * 10) / 10);
  }
  return data;
}

function randomDuration(): number {
  return Math.floor(Math.random() * 1200) + 800;
}

export function initializeSeedData(): void {
  if (!isBrowser) return;
  if (localStorage.getItem('dtp_seeded') === 'true') return;

  const now = new Date().toISOString();
  const day = (offset: number) =>
    new Date(Date.now() - offset * 86400000).toISOString();

  const projects: Project[] = [
    {
      id: 'proj-cd',
      name: '西南官话-成都',
      dialect: '西南官话',
      region: '四川成都',
      investigator: '张明',
      createdAt: day(30),
      updatedAt: day(1),
      status: 'active',
      description: '成都西南官话声调采样项目，覆盖阴平、阳平、上声、去声及入声',
    },
    {
      id: 'proj-sz',
      name: '吴语-苏州',
      dialect: '吴语',
      region: '江苏苏州',
      investigator: '李芳',
      createdAt: day(25),
      updatedAt: day(2),
      status: 'active',
      description: '苏州吴语声调采样项目，记录阴平、阳平、上声、阳去及入声调值',
    },
    {
      id: 'proj-gz',
      name: '粤语-广州',
      dialect: '粤语',
      region: '广东广州',
      investigator: '王伟',
      createdAt: day(20),
      updatedAt: day(3),
      status: 'completed',
      description: '广州粤语九声六调采样项目，已完成全部采样与标注',
    },
    {
      id: 'proj-xm',
      name: '闽南语-厦门',
      dialect: '闽南语',
      region: '福建厦门',
      investigator: '陈静',
      createdAt: day(15),
      updatedAt: day(2),
      status: 'active',
      description: '厦门闽南语声调采样项目，覆盖白读与文读声调',
    },
    {
      id: 'proj-cs',
      name: '湘语-长沙',
      dialect: '湘语',
      region: '湖南长沙',
      investigator: '刘洋',
      createdAt: day(10),
      updatedAt: day(5),
      status: 'archived',
      description: '长沙湘语声调采样项目，已归档',
    },
  ];

  for (const p of projects) {
    saveProject(p);
  }

  const batchNames = [
    '第一批-基础词表',
    '第二批-声调对比词',
    '第三批-补充词表',
  ];

  const batchMap: Record<string, Batch[]> = {};

  for (const p of projects) {
    const batches: Batch[] = [];
    for (let i = 0; i < 3; i++) {
      const b: Batch = {
        id: `batch-${p.id}-${i + 1}`,
        projectId: p.id,
        name: batchNames[i],
        createdAt: day(28 - i * 3),
        sampleIds: [],
        notes: '',
      };
      saveBatch(b);
      batches.push(b);
      batchMap[p.id] = batches;
    }
  }

  interface SampleDef {
    word: string;
    ipa: string;
    toneValue: string;
    toneCategory: string;
  }

  const sampleDefs: Record<string, SampleDef[]> = {
    'proj-cd': [
      { word: '天', ipa: 'tʰiɛn', toneValue: '55', toneCategory: '阴平' },
      { word: '田', ipa: 'tʰiɛn', toneValue: '21', toneCategory: '阳平' },
      { word: '点', ipa: 'tiɛn', toneValue: '53', toneCategory: '上声' },
      { word: '电', ipa: 'tiɛn', toneValue: '213', toneCategory: '去声' },
      { word: '滴', ipa: 'ti', toneValue: '2', toneCategory: '入声' },
      { word: '风', ipa: 'foŋ', toneValue: '55', toneCategory: '阴平' },
      { word: '红', ipa: 'xoŋ', toneValue: '21', toneCategory: '阳平' },
      { word: '比', ipa: 'pi', toneValue: '53', toneCategory: '上声' },
      { word: '病', ipa: 'pin', toneValue: '213', toneCategory: '去声' },
    ],
    'proj-sz': [
      { word: '天', ipa: 'tʰi', toneValue: '44', toneCategory: '阴平' },
      { word: '田', ipa: 'di', toneValue: '223', toneCategory: '阳平' },
      { word: '点', ipa: 'ti', toneValue: '51', toneCategory: '上声' },
      { word: '电', ipa: 'di', toneValue: '231', toneCategory: '阳去' },
      { word: '北', ipa: 'poʔ', toneValue: '4', toneCategory: '阴入' },
      { word: '白', ipa: 'baʔ', toneValue: '23', toneCategory: '阳入' },
      { word: '高', ipa: 'kæ', toneValue: '44', toneCategory: '阴平' },
      { word: '穷', ipa: 'dʑioŋ', toneValue: '223', toneCategory: '阳平' },
    ],
    'proj-gz': [
      { word: '天', ipa: 'tʰin', toneValue: '55', toneCategory: '阴平' },
      { word: '田', ipa: 'tʰin', toneValue: '21', toneCategory: '阳平' },
      { word: '点', ipa: 'tim', toneValue: '35', toneCategory: '阴上' },
      { word: '电', ipa: 'tin', toneValue: '22', toneCategory: '阳去' },
      { word: '七', ipa: 'tʃɐt', toneValue: '55', toneCategory: '阴入' },
      { word: '八', ipa: 'pat', toneValue: '33', toneCategory: '中入' },
      { word: '三', ipa: 'saːm', toneValue: '55', toneCategory: '阴平' },
    ],
    'proj-xm': [
      { word: '天', ipa: 'tʰi', toneValue: '55', toneCategory: '阴平' },
      { word: '田', ipa: 'tʃʰan', toneValue: '24', toneCategory: '阳平' },
      { word: '点', ipa: 'tiam', toneValue: '51', toneCategory: '上声' },
      { word: '电', ipa: 'tian', toneValue: '33', toneCategory: '去声' },
      { word: '八', ipa: 'pat', toneValue: '32', toneCategory: '阴入' },
      { word: '十', ipa: 'tsap', toneValue: '5', toneCategory: '阳入' },
      { word: '歌', ipa: 'kua', toneValue: '55', toneCategory: '阴平' },
    ],
    'proj-cs': [
      { word: '天', ipa: 'tʰiẽ', toneValue: '33', toneCategory: '阴平' },
      { word: '田', ipa: 'tiẽ', toneValue: '13', toneCategory: '阳平' },
      { word: '点', ipa: 'tiẽ', toneValue: '41', toneCategory: '上声' },
      { word: '电', ipa: 'tiẽ', toneValue: '45', toneCategory: '去声' },
      { word: '黑', ipa: 'xə', toneValue: '24', toneCategory: '入声' },
    ],
  };

  const allSamples: Sample[] = [];

  for (const p of projects) {
    const defs = sampleDefs[p.id];
    const batches = batchMap[p.id];
    const perBatch = Math.ceil(defs.length / 3);

    for (let bi = 0; bi < 3; bi++) {
      const batch = batches[bi];
      const start = bi * perBatch;
      const end = Math.min(start + perBatch, defs.length);
      const batchDefs = defs.slice(start, end);

      for (const def of batchDefs) {
        const sampleId = `sample-${uid().slice(0, 8)}`;
        let status: Sample['status'] = 'annotated';
        if (def.word === '病' && p.id === 'proj-cd') status = 'anomaly';
        if (def.word === '白' && p.id === 'proj-sz') status = 'anomaly';
        if (def.word === '黑' && p.id === 'proj-cs') status = 'draft';
        if (def.word === '比' && p.id === 'proj-cd') status = 'verified';
        if (def.word === '七' && p.id === 'proj-gz') status = 'verified';
        if (def.word === '歌' && p.id === 'proj-xm') status = 'verified';

        const sample: Sample = {
          id: sampleId,
          projectId: p.id,
          batchId: batch.id,
          word: def.word,
          ipa: def.ipa,
          toneValue: def.toneValue,
          toneCategory: def.toneCategory,
          recordingDuration: randomDuration(),
          waveformData: generateWaveform(100, 0.5 + Math.random() * 0.5),
          segmentationPoints: [0.2, 0.5, 0.8],
          pitchData: generatePitch(def.toneValue, 20),
          notes: '',
          status,
          createdAt: day(27 - Math.floor(Math.random() * 10)),
          updatedAt: day(Math.floor(Math.random() * 5)),
        };

        saveSample(sample);
        batch.sampleIds.push(sampleId);
        allSamples.push(sample);
      }

      saveBatch(batch);
    }
  }

  const versionDescriptions = [
    '初始录入完成',
    '声调值校正',
  ];

  for (const p of projects) {
    const batches = batchMap[p.id];
    for (let vi = 0; vi < 2; vi++) {
      const batch = batches[vi];
      const batchSamples = allSamples.filter((s) => s.batchId === batch.id);
      const snapshot: VersionSnapshot = {
        id: `version-${p.id}-${vi + 1}`,
        projectId: p.id,
        batchId: batch.id,
        version: vi + 1,
        snapshot: batchSamples,
        createdAt: day(25 - vi * 5),
        description: versionDescriptions[vi],
      };
      saveVersion(snapshot);
    }
  }

  const anomalies: Anomaly[] = [
    {
      id: 'anomaly-1',
      sampleId: allSamples.find((s) => s.projectId === 'proj-cd' && s.word === '病')!.id,
      projectId: 'proj-cd',
      type: 'pitch_outlier',
      description: '去声213调值基频偏低，疑似发音人误读',
      severity: 'high',
      createdAt: day(3),
      resolved: false,
    },
    {
      id: 'anomaly-2',
      sampleId: allSamples.find((s) => s.projectId === 'proj-sz' && s.word === '白')!.id,
      projectId: 'proj-sz',
      type: 'tone_mismatch',
      description: '阳入23调值与预期阴入调值混淆，需复核',
      severity: 'medium',
      createdAt: day(4),
      resolved: false,
    },
    {
      id: 'anomaly-3',
      sampleId: allSamples.find((s) => s.projectId === 'proj-cd' && s.word === '滴')!.id,
      projectId: 'proj-cd',
      type: 'segmentation_error',
      description: '入声字韵母段切分偏移，声调提取可能不准',
      severity: 'medium',
      createdAt: day(2),
      resolved: true,
    },
    {
      id: 'anomaly-4',
      sampleId: allSamples.find((s) => s.projectId === 'proj-cs' && s.word === '黑')!.id,
      projectId: 'proj-cs',
      type: 'missing_data',
      description: '入声采样未完成标注，缺少音高数据',
      severity: 'low',
      createdAt: day(5),
      resolved: false,
    },
    {
      id: 'anomaly-5',
      sampleId: allSamples.find((s) => s.projectId === 'proj-gz' && s.word === '八')!.id,
      projectId: 'proj-gz',
      type: 'pitch_outlier',
      description: '中入33调值音高曲线波动异常',
      severity: 'low',
      createdAt: day(6),
      resolved: true,
    },
    {
      id: 'anomaly-6',
      sampleId: allSamples.find((s) => s.projectId === 'proj-xm' && s.word === '十')!.id,
      projectId: 'proj-xm',
      type: 'tone_mismatch',
      description: '阳入5调值标注为阴入，需修正调类',
      severity: 'high',
      createdAt: day(1),
      resolved: false,
    },
    {
      id: 'anomaly-7',
      sampleId: allSamples.find((s) => s.projectId === 'proj-sz' && s.word === '点')!.id,
      projectId: 'proj-sz',
      type: 'segmentation_error',
      description: '上声51调值段终点切分过早',
      severity: 'medium',
      createdAt: day(3),
      resolved: false,
    },
    {
      id: 'anomaly-8',
      sampleId: allSamples.find((s) => s.projectId === 'proj-gz' && s.word === '电')!.id,
      projectId: 'proj-gz',
      type: 'missing_data',
      description: '阳去22采样缺少波形数据',
      severity: 'low',
      createdAt: day(4),
      resolved: true,
    },
  ];

  for (const a of anomalies) {
    saveAnomaly(a);
  }

  localStorage.setItem('dtp_seeded', 'true');
}
