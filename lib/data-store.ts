import { promises as fs } from 'fs';
import path from 'path';
import type {
  Project,
  GlazeRecipe,
  RecipeVersion,
  TestSpecimen,
  GlazeIngredient,
  DataValidationIssue,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'glaze-data.json');

interface DataStore {
  projects: Project[];
  recipes: GlazeRecipe[];
  ingredients: GlazeIngredient[];
  lastUpdated: string;
}

async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  try {
    await fs.access(DATA_FILE);
  } catch {
    const seedData = await getSeedData();
    await fs.writeFile(DATA_FILE, JSON.stringify(seedData, null, 2));
  }
}

async function readData(): Promise<DataStore> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

async function writeData(data: DataStore): Promise<void> {
  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
}

async function getSeedData(): Promise<DataStore> {
  const ingredients: GlazeIngredient[] = [
    { id: 'ing_silica', name: 'Silica (石英)', formula: 'SiO2', category: 'filler', notes: '主要玻璃形成体' },
    { id: 'ing_feldspar', name: 'Feldspar (长石)', formula: 'KAlSi3O8', category: 'flux', notes: '助熔剂，高温熔融' },
    { id: 'ing_kaolin', name: 'Kaolin (高岭土)', formula: 'Al2Si2O5(OH)4', category: 'filler', notes: '增加粘度和白度' },
    { id: 'ing_ball_clay', name: 'Ball Clay (球土)', category: 'filler', notes: '塑性粘土，增加生坯强度' },
    { id: 'ing_whiting', name: 'Whiting (石灰石)', formula: 'CaCO3', category: 'flux', notes: '钙助熔剂' },
    { id: 'ing_dolomite', name: 'Dolomite (白云石)', formula: 'CaMg(CO3)2', category: 'flux', notes: '钙镁助熔剂' },
    { id: 'ing_zinc', name: 'Zinc Oxide (氧化锌)', formula: 'ZnO', category: 'flux', notes: '助熔剂，影响光泽' },
    { id: 'ing_talc', name: 'Talc (滑石)', formula: 'Mg3Si4O10(OH)2', category: 'flux', notes: '镁助熔剂' },
    { id: 'ing_borax', name: 'Borax (硼砂)', formula: 'Na2B4O7·10H2O', category: 'flux', notes: '低温助熔剂' },
    { id: 'ing_soda_ash', name: 'Soda Ash (纯碱)', formula: 'Na2CO3', category: 'flux', notes: '钠助熔剂' },
    { id: 'ing_titanium', name: 'Titanium Dioxide (钛白)', formula: 'TiO2', category: 'opacifier', notes: '乳浊剂' },
    { id: 'ing_zircon', name: 'Zircon (锆英石)', formula: 'ZrSiO4', category: 'opacifier', notes: '乳浊剂，增加白度' },
    { id: 'ing_iron_oxide', name: 'Iron Oxide (氧化铁)', formula: 'Fe2O3', category: 'colorant', notes: '红色/棕色着色剂' },
    { id: 'ing_cobalt', name: 'Cobalt Oxide (氧化钴)', formula: 'CoO', category: 'colorant', notes: '蓝色着色剂' },
    { id: 'ing_copper', name: 'Copper Carbonate (碳酸铜)', formula: 'CuCO3', category: 'colorant', notes: '绿色/蓝色着色剂' },
    { id: 'ing_manganese', name: 'Manganese Dioxide (二氧化锰)', formula: 'MnO2', category: 'colorant', notes: '紫色/棕色着色剂' },
    { id: 'ing_nickel', name: 'Nickel Oxide (氧化镍)', formula: 'NiO', category: 'colorant', notes: '灰色/棕色着色剂' },
    { id: 'ing_chromium', name: 'Chromium Oxide (氧化铬)', formula: 'Cr2O3', category: 'colorant', notes: '绿色着色剂' },
    { id: 'ing_bentonite', name: 'Bentonite (膨润土)', category: 'stabilizer', notes: '悬浮剂，防止沉淀' },
    { id: 'ing_cmc', name: 'CMC (羧甲基纤维素)', category: 'stabilizer', notes: '增稠剂，粘结剂' },
  ];

  const now = new Date().toISOString();

  const projects: Project[] = [
    {
      id: 'proj_celadon',
      name: '青瓷釉料系统研究',
      code: 'CEL-2024',
      description: '探索不同长石-高岭土比例对青瓷釉面效果的影响，系统研究还原焰下的呈色机理',
      createdAt: '2024-03-15T10:00:00.000Z',
      updatedAt: '2024-06-20T14:30:00.000Z',
      recipeCount: 5,
      specimenCount: 25,
      status: 'active',
      tags: ['青瓷', '还原焰', '长石系'],
      primaryKiln: '气窑A',
      targetCone: '06',
    },
    {
      id: 'proj_tenmoku',
      name: '天目釉系列开发',
      code: 'TEN-2024',
      description: '高铁含量釉料在不同烧成制度下的析晶效果研究，目标油滴、兔毫等经典天目效果',
      createdAt: '2024-01-10T09:00:00.000Z',
      updatedAt: '2024-05-28T16:45:00.000Z',
      recipeCount: 4,
      specimenCount: 32,
      status: 'active',
      tags: ['天目', '铁结晶', '高温'],
      primaryKiln: '气窑B',
      targetCone: '10',
    },
    {
      id: 'proj_lowfire',
      name: '低温釉彩色卡项目',
      code: 'LOW-2024',
      description: '建立低温铅硼釉基础配方体系，系统测试各类金属氧化物呈色效果',
      createdAt: '2024-02-20T11:00:00.000Z',
      updatedAt: '2024-04-15T10:20:00.000Z',
      recipeCount: 6,
      specimenCount: 48,
      status: 'completed',
      tags: ['低温', '釉彩', '色卡'],
      primaryKiln: '电窑',
      targetCone: '022',
    },
    {
      id: 'proj_matting',
      name: '哑光釉配方优化',
      code: 'MAT-2024',
      description: '通过调整钙镁比例和硅铝比，开发不同质感的哑光釉系列',
      createdAt: '2024-04-05T08:30:00.000Z',
      updatedAt: '2024-06-10T09:15:00.000Z',
      recipeCount: 3,
      specimenCount: 15,
      status: 'on-hold',
      tags: ['哑光', '钙镁系', '氧化焰'],
      primaryKiln: '气窑A',
      targetCone: '06',
    },
  ];

  const binaryComponents: { components: Array<{ ingredientId: string; ingredientName: string; percentage: number; locked: boolean }>; label: string }[] = [];
  const feldsparStart = 30;
  const feldsparEnd = 70;
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const feldspar = feldsparStart + (feldsparEnd - feldsparStart) * (i / steps);
    const kaolin = 40 - feldspar * 0.2;
    const silica = 30 - feldspar * 0.1;
    binaryComponents.push({
      label: `F${feldspar.toFixed(0)}`,
      components: [
        { ingredientId: 'ing_feldspar', ingredientName: 'Feldspar (长石)', percentage: feldspar, locked: false },
        { ingredientId: 'ing_kaolin', ingredientName: 'Kaolin (高岭土)', percentage: kaolin, locked: false },
        { ingredientId: 'ing_silica', ingredientName: 'Silica (石英)', percentage: silica, locked: true },
        { ingredientId: 'ing_whiting', ingredientName: 'Whiting (石灰石)', percentage: 15, locked: true },
        { ingredientId: 'ing_iron_oxide', ingredientName: 'Iron Oxide (氧化铁)', percentage: 3, locked: true },
      ],
    });
  }

  const recipes: GlazeRecipe[] = [
    {
      id: 'recipe_celadon_base',
      name: '青瓷基础配方',
      code: 'CEL-B01',
      projectId: 'proj_celadon',
      description: '经典青瓷基础配方，长石-高岭土二元体系',
      coneTarget: '06',
      currentVersionId: 'ver_celadon_v2',
      matrixType: 'binary',
      matrixConfig: {
        type: 'binary',
        baseIngredients: ['ing_feldspar', 'ing_kaolin'],
        minPercentages: [30, 20],
        maxPercentages: [70, 50],
        steps: 5,
        fixedComponents: [
          { ingredientId: 'ing_silica', ingredientName: 'Silica (石英)', percentage: 25, locked: true },
          { ingredientId: 'ing_whiting', ingredientName: 'Whiting (石灰石)', percentage: 15, locked: true },
          { ingredientId: 'ing_iron_oxide', ingredientName: 'Iron Oxide (氧化铁)', percentage: 2.5, locked: true },
        ],
      },
      tags: ['青瓷', '基础配方', '还原焰'],
      status: 'active',
      createdAt: '2024-03-16T10:00:00.000Z',
      updatedAt: '2024-05-20T14:30:00.000Z',
      versions: [
        {
          id: 'ver_celadon_v1',
          recipeId: 'recipe_celadon_base',
          versionNumber: 1,
          batchNumber: 'BATCH-001',
          components: [
            { ingredientId: 'ing_feldspar', ingredientName: 'Feldspar (长石)', percentage: 45, locked: false },
            { ingredientId: 'ing_kaolin', ingredientName: 'Kaolin (高岭土)', percentage: 25, locked: false },
            { ingredientId: 'ing_silica', ingredientName: 'Silica (石英)', percentage: 20, locked: true },
            { ingredientId: 'ing_whiting', ingredientName: 'Whiting (石灰石)', percentage: 10, locked: true },
            { ingredientId: 'ing_iron_oxide', ingredientName: 'Iron Oxide (氧化铁)', percentage: 2, locked: true },
          ],
          totalPercentage: 102,
          firingTemperature: 1240,
          firingType: 'reduction',
          holdTime: 20,
          createdAt: '2024-03-16T10:00:00.000Z',
          createdBy: '张工',
          changeNotes: '初始配方，基于传统青瓷比例',
          isLocked: true,
          specimens: generateSpecimens('recipe_celadon_base', 'ver_celadon_v1', 5, 'v1'),
        },
        {
          id: 'ver_celadon_v2',
          recipeId: 'recipe_celadon_base',
          versionNumber: 2,
          batchNumber: 'BATCH-003',
          components: [
            { ingredientId: 'ing_feldspar', ingredientName: 'Feldspar (长石)', percentage: 50, locked: false },
            { ingredientId: 'ing_kaolin', ingredientName: 'Kaolin (高岭土)', percentage: 22, locked: false },
            { ingredientId: 'ing_silica', ingredientName: 'Silica (石英)', percentage: 23, locked: true },
            { ingredientId: 'ing_whiting', ingredientName: 'Whiting (石灰石)', percentage: 12, locked: true },
            { ingredientId: 'ing_iron_oxide', ingredientName: 'Iron Oxide (氧化铁)', percentage: 2.5, locked: true },
          ],
          totalPercentage: 109.5,
          firingTemperature: 1250,
          firingType: 'reduction',
          holdTime: 25,
          createdAt: '2024-05-10T09:30:00.000Z',
          createdBy: '李工',
          changeNotes: '增加长石比例和氧化铁含量，调整硅钙比',
          isLocked: false,
          specimens: generateSpecimens('recipe_celadon_base', 'ver_celadon_v2', 5, 'v2'),
        },
      ],
    },
    {
      id: 'recipe_tenmoku_oilspot',
      name: '油滴天目',
      code: 'TEN-O01',
      projectId: 'proj_tenmoku',
      description: '高铁釉料，保温析晶形成油滴效果',
      coneTarget: '10',
      currentVersionId: 'ver_tenmoku_v2',
      matrixType: 'single',
      tags: ['天目', '油滴', '高温'],
      status: 'experimental',
      createdAt: '2024-01-15T11:00:00.000Z',
      updatedAt: '2024-05-28T16:45:00.000Z',
      versions: [
        {
          id: 'ver_tenmoku_v1',
          recipeId: 'recipe_tenmoku_oilspot',
          versionNumber: 1,
          batchNumber: 'TEN-B01',
          components: [
            { ingredientId: 'ing_feldspar', ingredientName: 'Feldspar (长石)', percentage: 35, locked: false },
            { ingredientId: 'ing_kaolin', ingredientName: 'Kaolin (高岭土)', percentage: 15, locked: false },
            { ingredientId: 'ing_silica', ingredientName: 'Silica (石英)', percentage: 20, locked: false },
            { ingredientId: 'ing_iron_oxide', ingredientName: 'Iron Oxide (氧化铁)', percentage: 12, locked: true },
            { ingredientId: 'ing_talc', ingredientName: 'Talc (滑石)', percentage: 8, locked: false },
            { ingredientId: 'ing_dolomite', ingredientName: 'Dolomite (白云石)', percentage: 10, locked: false },
          ],
          totalPercentage: 100,
          firingTemperature: 1280,
          firingType: 'oxidation',
          holdTime: 45,
          createdAt: '2024-01-15T11:00:00.000Z',
          createdBy: '王工',
          changeNotes: '初始配方，高含铁量',
          isLocked: true,
          specimens: generateSpecimens('recipe_tenmoku_oilspot', 'ver_tenmoku_v1', 4, 'v1'),
        },
        {
          id: 'ver_tenmoku_v2',
          recipeId: 'recipe_tenmoku_oilspot',
          versionNumber: 2,
          batchNumber: 'TEN-B03',
          components: [
            { ingredientId: 'ing_feldspar', ingredientName: 'Feldspar (长石)', percentage: 38, locked: false },
            { ingredientId: 'ing_kaolin', ingredientName: 'Kaolin (高岭土)', percentage: 12, locked: false },
            { ingredientId: 'ing_silica', ingredientName: 'Silica (石英)', percentage: 22, locked: false },
            { ingredientId: 'ing_iron_oxide', ingredientName: 'Iron Oxide (氧化铁)', percentage: 14, locked: true },
            { ingredientId: 'ing_talc', ingredientName: 'Talc (滑石)', percentage: 6, locked: false },
            { ingredientId: 'ing_dolomite', ingredientName: 'Dolomite (白云石)', percentage: 8, locked: false },
          ],
          totalPercentage: 100,
          firingTemperature: 1300,
          firingType: 'reduction',
          holdTime: 60,
          createdAt: '2024-04-20T10:00:00.000Z',
          createdBy: '王工',
          changeNotes: '提高铁含量和烧成温度，延长保温时间，改用还原焰',
          isLocked: false,
          specimens: generateSpecimens('recipe_tenmoku_oilspot', 'ver_tenmoku_v2', 4, 'v2'),
        },
      ],
    },
    {
      id: 'recipe_lowfire_leadborate',
      name: '铅硼基础釉',
      code: 'LOW-B01',
      projectId: 'proj_lowfire',
      description: '低温铅硼熔块基础配方，适用于釉上彩',
      coneTarget: '022',
      currentVersionId: 'ver_lowfire_v1',
      matrixType: 'ternary',
      matrixConfig: {
        type: 'ternary',
        baseIngredients: ['ing_borax', 'ing_soda_ash', 'ing_silica'],
        minPercentages: [20, 5, 30],
        maxPercentages: [40, 15, 50],
        steps: 3,
        fixedComponents: [
          { ingredientId: 'ing_ball_clay', ingredientName: 'Ball Clay (球土)', percentage: 10, locked: true },
        ],
      },
      tags: ['低温', '铅硼', '基础釉'],
      status: 'active',
      createdAt: '2024-02-21T09:00:00.000Z',
      updatedAt: '2024-04-15T10:20:00.000Z',
      versions: [
        {
          id: 'ver_lowfire_v1',
          recipeId: 'recipe_lowfire_leadborate',
          versionNumber: 1,
          batchNumber: 'LOW-B01',
          components: [
            { ingredientId: 'ing_borax', ingredientName: 'Borax (硼砂)', percentage: 30, locked: false },
            { ingredientId: 'ing_soda_ash', ingredientName: 'Soda Ash (纯碱)', percentage: 10, locked: false },
            { ingredientId: 'ing_silica', ingredientName: 'Silica (石英)', percentage: 40, locked: false },
            { ingredientId: 'ing_ball_clay', ingredientName: 'Ball Clay (球土)', percentage: 10, locked: true },
            { ingredientId: 'ing_zinc', ingredientName: 'Zinc Oxide (氧化锌)', percentage: 8, locked: false },
            { ingredientId: 'ing_titanium', ingredientName: 'Titanium Dioxide (钛白)', percentage: 2, locked: false },
          ],
          totalPercentage: 100,
          firingTemperature: 750,
          firingType: 'oxidation',
          holdTime: 10,
          createdAt: '2024-02-21T09:00:00.000Z',
          createdBy: '陈工',
          changeNotes: '初始低温基础配方',
          isLocked: true,
          specimens: generateSpecimens('recipe_lowfire_leadborate', 'ver_lowfire_v1', 6, 'v1'),
        },
      ],
    },
    {
      id: 'recipe_matte_calcium',
      name: '钙系哑光釉',
      code: 'MAT-C01',
      projectId: 'proj_matting',
      description: '高钙含量哑光釉，通过析晶产生哑光效果',
      coneTarget: '06',
      currentVersionId: 'ver_matte_v1',
      matrixType: 'binary',
      matrixConfig: {
        type: 'binary',
        baseIngredients: ['ing_whiting', 'ing_talc'],
        minPercentages: [10, 5],
        maxPercentages: [25, 15],
        steps: 4,
        fixedComponents: [
          { ingredientId: 'ing_feldspar', ingredientName: 'Feldspar (长石)', percentage: 40, locked: true },
          { ingredientId: 'ing_silica', ingredientName: 'Silica (石英)', percentage: 25, locked: true },
          { ingredientId: 'ing_kaolin', ingredientName: 'Kaolin (高岭土)', percentage: 15, locked: true },
        ],
      },
      tags: ['哑光', '钙系', '氧化焰'],
      status: 'active',
      createdAt: '2024-04-05T08:30:00.000Z',
      updatedAt: '2024-06-10T09:15:00.000Z',
      versions: [
        {
          id: 'ver_matte_v1',
          recipeId: 'recipe_matte_calcium',
          versionNumber: 1,
          batchNumber: 'MAT-B01',
          components: [
            { ingredientId: 'ing_feldspar', ingredientName: 'Feldspar (长石)', percentage: 40, locked: true },
            { ingredientId: 'ing_silica', ingredientName: 'Silica (石英)', percentage: 25, locked: true },
            { ingredientId: 'ing_kaolin', ingredientName: 'Kaolin (高岭土)', percentage: 15, locked: true },
            { ingredientId: 'ing_whiting', ingredientName: 'Whiting (石灰石)', percentage: 15, locked: false },
            { ingredientId: 'ing_talc', ingredientName: 'Talc (滑石)', percentage: 5, locked: false },
          ],
          totalPercentage: 100,
          firingTemperature: 1220,
          firingType: 'oxidation',
          holdTime: 30,
          createdAt: '2024-04-05T08:30:00.000Z',
          createdBy: '赵工',
          changeNotes: '初始哑光配方，高钙低镁',
          isLocked: false,
          specimens: generateSpecimens('recipe_matte_calcium', 'ver_matte_v1', 5, 'v1'),
        },
      ],
    },
    {
      id: 'recipe_celadon_iron',
      name: '铁系青瓷变色实验',
      code: 'CEL-E02',
      projectId: 'proj_celadon',
      description: '系统性测试不同铁含量对青瓷呈色的影响',
      coneTarget: '06',
      currentVersionId: 'ver_celadon_iron_v1',
      matrixType: 'binary',
      matrixConfig: {
        type: 'binary',
        baseIngredients: ['ing_iron_oxide', 'ing_titanium'],
        minPercentages: [0.5, 0],
        maxPercentages: [6, 4],
        steps: 5,
        fixedComponents: [
          { ingredientId: 'ing_feldspar', ingredientName: 'Feldspar (长石)', percentage: 50, locked: true },
          { ingredientId: 'ing_kaolin', ingredientName: 'Kaolin (高岭土)', percentage: 22, locked: true },
          { ingredientId: 'ing_silica', ingredientName: 'Silica (石英)', percentage: 23, locked: true },
          { ingredientId: 'ing_whiting', ingredientName: 'Whiting (石灰石)', percentage: 12, locked: true },
        ],
      },
      tags: ['青瓷', '铁系', '着色实验'],
      status: 'experimental',
      createdAt: '2024-05-01T10:00:00.000Z',
      updatedAt: '2024-06-15T11:30:00.000Z',
      versions: [
        {
          id: 'ver_celadon_iron_v1',
          recipeId: 'recipe_celadon_iron',
          versionNumber: 1,
          batchNumber: 'CEL-B05',
          components: [
            { ingredientId: 'ing_feldspar', ingredientName: 'Feldspar (长石)', percentage: 50, locked: true },
            { ingredientId: 'ing_kaolin', ingredientName: 'Kaolin (高岭土)', percentage: 22, locked: true },
            { ingredientId: 'ing_silica', ingredientName: 'Silica (石英)', percentage: 23, locked: true },
            { ingredientId: 'ing_whiting', ingredientName: 'Whiting (石灰石)', percentage: 12, locked: true },
            { ingredientId: 'ing_iron_oxide', ingredientName: 'Iron Oxide (氧化铁)', percentage: 3, locked: false },
            { ingredientId: 'ing_titanium', ingredientName: 'Titanium Dioxide (钛白)', percentage: 1, locked: false },
          ],
          totalPercentage: 111,
          firingTemperature: 1250,
          firingType: 'reduction',
          holdTime: 20,
          createdAt: '2024-05-01T10:00:00.000Z',
          createdBy: '李工',
          changeNotes: '铁钛二元系统着色实验初始版',
          isLocked: false,
          specimens: generateSpecimens('recipe_celadon_iron', 'ver_celadon_iron_v1', 6, 'v1'),
        },
      ],
    },
  ];

  return {
    projects,
    recipes,
    ingredients,
    lastUpdated: now,
  };
}

function generateSpecimens(recipeId: string, versionId: string, count: number, suffix: string): TestSpecimen[] {
  const specimens: TestSpecimen[] = [];
  const colors = ['#7BA38D', '#5D8A6D', '#8FB996', '#4A7C59', '#A3C9A8', '#3D6B4F'];
  const qualities: Array<'excellent' | 'good' | 'fair' | 'poor'> = ['excellent', 'good', 'good', 'fair', 'good', 'excellent'];
  const glosses: Array<'high' | 'medium' | 'low' | 'matte'> = ['medium', 'medium', 'low', 'low', 'medium', 'high'];
  const defectOptions = [
    [],
    ['针孔'],
    ['气泡'],
    ['流釉'],
    ['针孔', '气泡'],
    [],
  ];

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    specimens.push({
      id: `spec_${recipeId}_${suffix}_${i}`,
      recipeId,
      versionId,
      position: { row, col },
      label: `${recipeId.split('_')[1].toUpperCase()}-${String.fromCharCode(65 + row)}${col + 1}`,
      firedColor: colors[i % colors.length],
      surfaceQuality: qualities[i % qualities.length],
      glossLevel: glosses[i % glosses.length],
      defects: defectOptions[i % defectOptions.length],
      notes: `试片 ${i + 1} 烧成记录`,
      firedAt: `2024-0${(i % 6) + 1}-${10 + i}T14:00:00.000Z`,
    });
  }
  return specimens;
}

export async function getAllProjects(): Promise<Project[]> {
  const data = await readData();
  return data.projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getProjectById(id: string): Promise<Project | null> {
  const data = await readData();
  return data.projects.find(p => p.id === id) || null;
}

export async function createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'recipeCount' | 'specimenCount'>): Promise<Project> {
  const data = await readData();
  const now = new Date().toISOString();
  const newProject: Project = {
    ...project,
    id: generateId('proj'),
    createdAt: now,
    updatedAt: now,
    recipeCount: 0,
    specimenCount: 0,
  };
  data.projects.push(newProject);
  await writeData(data);
  return newProject;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const data = await readData();
  const index = data.projects.findIndex(p => p.id === id);
  if (index === -1) return null;
  data.projects[index] = { ...data.projects[index], ...updates, updatedAt: new Date().toISOString() };
  await writeData(data);
  return data.projects[index];
}

export async function deleteProject(id: string): Promise<boolean> {
  const data = await readData();
  const index = data.projects.findIndex(p => p.id === id);
  if (index === -1) return false;
  data.projects.splice(index, 1);
  data.recipes = data.recipes.filter(r => r.projectId !== id);
  await writeData(data);
  return true;
}

export async function getRecipesByProject(projectId: string): Promise<GlazeRecipe[]> {
  const data = await readData();
  return data.recipes.filter(r => r.projectId === projectId);
}

export async function getRecipeById(id: string): Promise<GlazeRecipe | null> {
  const data = await readData();
  return data.recipes.find(r => r.id === id) || null;
}

export async function getAllRecipes(): Promise<GlazeRecipe[]> {
  const data = await readData();
  return data.recipes;
}

export async function createRecipe(recipe: Omit<GlazeRecipe, 'id' | 'createdAt' | 'updatedAt' | 'versions' | 'currentVersionId'>): Promise<GlazeRecipe> {
  const data = await readData();
  const now = new Date().toISOString();
  const newRecipe: GlazeRecipe = {
    ...recipe,
    id: generateId('recipe'),
    createdAt: now,
    updatedAt: now,
    versions: [],
    currentVersionId: '',
  };
  data.recipes.push(newRecipe);

  const project = data.projects.find(p => p.id === recipe.projectId);
  if (project) {
    project.recipeCount++;
    project.updatedAt = now;
  }

  await writeData(data);
  return newRecipe;
}

export async function updateRecipe(id: string, updates: Partial<GlazeRecipe>): Promise<GlazeRecipe | null> {
  const data = await readData();
  const index = data.recipes.findIndex(r => r.id === id);
  if (index === -1) return null;
  data.recipes[index] = { ...data.recipes[index], ...updates, updatedAt: new Date().toISOString() };
  await writeData(data);
  return data.recipes[index];
}

export async function addRecipeVersion(recipeId: string, version: Omit<RecipeVersion, 'id' | 'createdAt' | 'specimens' | 'versionNumber'>): Promise<RecipeVersion | null> {
  const data = await readData();
  const recipe = data.recipes.find(r => r.id === recipeId);
  if (!recipe) return null;

  const now = new Date().toISOString();
  const newVersion: RecipeVersion = {
    ...version,
    id: generateId('ver'),
    createdAt: now,
    specimens: [],
    versionNumber: recipe.versions.length + 1,
  };

  recipe.versions.push(newVersion);
  recipe.currentVersionId = newVersion.id;
  recipe.updatedAt = now;

  await writeData(data);
  return newVersion;
}

export async function getVersionById(recipeId: string, versionId: string): Promise<RecipeVersion | null> {
  const recipe = await getRecipeById(recipeId);
  if (!recipe) return null;
  return recipe.versions.find(v => v.id === versionId) || null;
}

export async function lockVersion(recipeId: string, versionId: string): Promise<boolean> {
  const data = await readData();
  const recipe = data.recipes.find(r => r.id === recipeId);
  if (!recipe) return false;
  const version = recipe.versions.find(v => v.id === versionId);
  if (!version) return false;
  version.isLocked = true;
  await writeData(data);
  return true;
}

export async function unlockVersion(recipeId: string, versionId: string): Promise<boolean> {
  const data = await readData();
  const recipe = data.recipes.find(r => r.id === recipeId);
  if (!recipe) return false;
  const version = recipe.versions.find(v => v.id === versionId);
  if (!version) return false;
  version.isLocked = false;
  await writeData(data);
  return true;
}

export async function addSpecimen(recipeId: string, versionId: string, specimen: Omit<TestSpecimen, 'id' | 'recipeId' | 'versionId'>): Promise<TestSpecimen | null> {
  const data = await readData();
  const recipe = data.recipes.find(r => r.id === recipeId);
  if (!recipe) return null;
  const version = recipe.versions.find(v => v.id === versionId);
  if (!version) return null;

  const newSpecimen: TestSpecimen = {
    ...specimen,
    id: generateId('spec'),
    recipeId,
    versionId,
  };

  version.specimens.push(newSpecimen);

  const project = data.projects.find(p => p.id === recipe.projectId);
  if (project) {
    project.specimenCount++;
    project.updatedAt = new Date().toISOString();
  }

  await writeData(data);
  return newSpecimen;
}

export async function updateSpecimen(recipeId: string, versionId: string, specimenId: string, updates: Partial<TestSpecimen>): Promise<TestSpecimen | null> {
  const data = await readData();
  const recipe = data.recipes.find(r => r.id === recipeId);
  if (!recipe) return null;
  const version = recipe.versions.find(v => v.id === versionId);
  if (!version) return null;
  const specimenIndex = version.specimens.findIndex(s => s.id === specimenId);
  if (specimenIndex === -1) return null;

  version.specimens[specimenIndex] = { ...version.specimens[specimenIndex], ...updates };
  await writeData(data);
  return version.specimens[specimenIndex];
}

export async function getAllIngredients(): Promise<GlazeIngredient[]> {
  const data = await readData();
  return data.ingredients;
}

export function validateRecipeComponents(components: Array<{ percentage: number; ingredientName: string }>): DataValidationIssue[] {
  const issues: DataValidationIssue[] = [];
  const total = components.reduce((sum, c) => sum + c.percentage, 0);

  if (Math.abs(total - 100) > 0.1) {
    issues.push({
      severity: total > 100 ? 'warning' : 'error',
      field: 'totalPercentage',
      message: `配方总含量为 ${total.toFixed(1)}%，${total > 100 ? '超出' : '不足'}100%`,
    });
  }

  components.forEach((comp, idx) => {
    if (comp.percentage < 0) {
      issues.push({
        severity: 'error',
        field: `components[${idx}].percentage`,
        message: `${comp.ingredientName} 的百分比不能为负数`,
      });
    }
    if (comp.percentage > 100) {
      issues.push({
        severity: 'error',
        field: `components[${idx}].percentage`,
        message: `${comp.ingredientName} 的百分比不能超过 100%`,
      });
    }
    if (comp.percentage > 60) {
      issues.push({
        severity: 'warning',
        field: `components[${idx}].percentage`,
        message: `${comp.ingredientName} 含量较高 (${comp.percentage}%)，请确认是否合理`,
      });
    }
    if (comp.percentage > 0 && comp.percentage < 0.5) {
      issues.push({
        severity: 'info',
        field: `components[${idx}].percentage`,
        message: `${comp.ingredientName} 含量很低 (${comp.percentage}%)，称量误差可能较大`,
      });
    }
  });

  return issues;
}

export function validateFiringParams(temperature: number, cone: string): DataValidationIssue[] {
  const issues: DataValidationIssue[] = [];

  if (temperature < 500) {
    issues.push({
      severity: 'error',
      field: 'firingTemperature',
      message: '烧成温度过低，低于常见陶瓷烧成范围',
    });
  }
  if (temperature > 1450) {
    issues.push({
      severity: 'error',
      field: 'firingTemperature',
      message: '烧成温度过高，超出常见陶瓷烧成范围',
    });
  }

  const coneTemps: Record<string, number> = {
    '022': 600, '020': 650, '018': 700, '016': 750, '014': 800,
    '012': 850, '010': 900, '08': 950, '06': 1000, '05': 1050,
    '04': 1100, '03': 1120, '02': 1140, '01': 1160,
    '1': 1180, '2': 1200, '3': 1220, '4': 1240, '5': 1260,
    '6': 1280, '7': 1300, '8': 1320, '9': 1340, '10': 1360,
    '11': 1380, '12': 1400, '13': 1420, '14': 1440,
  };

  const expectedTemp = coneTemps[cone];
  if (expectedTemp && Math.abs(temperature - expectedTemp) > 100) {
    issues.push({
      severity: 'warning',
      field: 'firingTemperature',
      message: `烧成温度 (${temperature}°C) 与目标锥号 ${cone} (约 ${expectedTemp}°C) 偏差较大`,
    });
  }

  return issues;
}

export async function searchRecipes(query: string, filters?: { projectId?: string; status?: string; tags?: string[] }): Promise<GlazeRecipe[]> {
  const data = await readData();
  let results = data.recipes;

  if (filters?.projectId) {
    results = results.filter(r => r.projectId === filters.projectId);
  }
  if (filters?.status) {
    results = results.filter(r => r.status === filters.status);
  }
  if (filters?.tags && filters.tags.length > 0) {
    results = results.filter(r => filters.tags!.some(t => r.tags.includes(t)));
  }

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  return results;
}

export async function searchProjects(query: string): Promise<Project[]> {
  const data = await readData();
  if (!query) return data.projects;
  const q = query.toLowerCase();
  return data.projects.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.code.toLowerCase().includes(q) ||
    p.description?.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  );
}

export { generateId };
