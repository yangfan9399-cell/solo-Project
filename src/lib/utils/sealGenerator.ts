import type {
	SealShape,
	SealScriptType,
	BorderType,
	CharacterPosition,
	BorderAssessment,
	ZhuBaiAnalysis,
	DensityAssessment,
	KnifeTechniqueSuggestion,
	DensityLevel,
	KnifeTechnique
} from '$lib/types';

interface SealGeneratorOptions {
	shape: SealShape;
	scriptType: SealScriptType;
	borderType: BorderType;
	characters: string[];
	size?: number;
}

export function generateCharacterPositions(options: SealGeneratorOptions): CharacterPosition[] {
	const { shape, characters, size = 200 } = options;
	const charCount = characters.length;
	let cols = Math.ceil(Math.sqrt(charCount));
	let rows = Math.ceil(charCount / cols);

	if (charCount === 2) {
		cols = 2;
		rows = 1;
	} else if (charCount === 3) {
		cols = 3;
		rows = 1;
	}

	const padding = size * 0.1;
	const contentSize = size - padding * 2;
	const charWidth = contentSize / cols;
	const charHeight = contentSize / rows;

	const charPositions: CharacterPosition[] = [];

	for (let i = 0; i < charCount; i++) {
		const row = Math.floor(i / cols);
		const col = i % cols;
		const x = padding + col * charWidth + charWidth / 2;
		const y = padding + row * charHeight + charHeight / 2;

		const char = characters[i] || '';
		charPositions.push({
			index: i,
			character: char,
			x,
			y,
			width: charWidth * 0.8,
			height: charHeight * 0.8,
			rotation: 0,
			strokeCount: Math.floor(Math.random() * 8) + 4
		});
	}

	return charPositions;
}

export function generateSealSvg(options: SealGeneratorOptions): string {
	const { shape, scriptType, borderType, characters, size = 200 } = options;
	const isZhuwen = scriptType === 'zhuwen';
	const inkColor = isZhuwen ? '#c41e3a' : '#1a1a1a';
	const bgColor = isZhuwen ? '#f5f0e8' : inkColor;
	const textColor = isZhuwen ? inkColor : '#f5f0e8';

	const charCount = characters.length;
	let cols = Math.ceil(Math.sqrt(charCount));
	let rows = Math.ceil(charCount / cols);

	if (charCount === 2) {
		cols = 2;
		rows = 1;
	} else if (charCount === 3) {
		cols = 3;
		rows = 1;
	}

	const padding = size * 0.1;
	const contentSize = size - padding * 2;
	const charWidth = contentSize / cols;
	const charHeight = contentSize / rows;

	let clipPath = '';
	let shapeElement = '';

	if (shape === 'square') {
		shapeElement = `<rect x="0" y="0" width="${size}" height="${size}" fill="${bgColor}"/>`;
	} else if (shape === 'round') {
		clipPath = `<clipPath id="sealClip"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}"/></clipPath>`;
		shapeElement = `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${bgColor}"/>`;
	} else if (shape === 'rectangle') {
		const w = size;
		const h = size * 0.6;
		shapeElement = `<rect x="0" y="${(size - h) / 2}" width="${w}" height="${h}" fill="${bgColor}"/>`;
	} else if (shape === 'oval') {
		const w = size;
		const h = size * 0.6;
		clipPath = `<clipPath id="sealClip"><ellipse cx="${size / 2}" cy="${size / 2}" rx="${w / 2 - 2}" ry="${h / 2 - 2}"/></clipPath>`;
		shapeElement = `<ellipse cx="${size / 2}" cy="${size / 2}" rx="${w / 2 - 2}" ry="${h / 2 - 2}" fill="${bgColor}"/>`;
	} else {
		shapeElement = `<rect x="0" y="0" width="${size}" height="${size}" fill="${bgColor}" rx="${size * 0.15}"/>`;
	}

	let borderElement = '';
	const borderWidth = size * 0.04;

	if (borderType === 'single') {
		if (shape === 'round' || shape === 'oval') {
			const rx = shape === 'round' ? size / 2 - borderWidth : size / 2 - borderWidth;
			const ry = shape === 'round' ? size / 2 - borderWidth : size * 0.3 - borderWidth;
			borderElement = `<ellipse cx="${size / 2}" cy="${size / 2}" rx="${rx}" ry="${ry}" fill="none" stroke="${inkColor}" stroke-width="${borderWidth}"/>`;
		} else {
			const bw = shape === 'rectangle' ? size - borderWidth * 2 : size - borderWidth * 2;
			const bh = shape === 'rectangle' ? size * 0.6 - borderWidth * 2 : size - borderWidth * 2;
			const bx = borderWidth;
			const by = shape === 'rectangle' ? (size - bh) / 2 : borderWidth;
			borderElement = `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="${inkColor}" stroke-width="${borderWidth}"/>`;
		}
	} else if (borderType === 'double') {
		if (shape === 'round' || shape === 'oval') {
			const rx1 = size / 2 - borderWidth * 0.5;
			const ry1 = shape === 'round' ? rx1 : size * 0.3 - borderWidth * 0.5;
			const rx2 = size / 2 - borderWidth * 2;
			const ry2 = shape === 'round' ? rx2 : size * 0.3 - borderWidth * 2;
			borderElement = `
				<ellipse cx="${size / 2}" cy="${size / 2}" rx="${rx1}" ry="${ry1}" fill="none" stroke="${inkColor}" stroke-width="${borderWidth * 0.6}"/>
				<ellipse cx="${size / 2}" cy="${size / 2}" rx="${rx2}" ry="${ry2}" fill="none" stroke="${inkColor}" stroke-width="${borderWidth * 0.6}"/>
			`;
		} else {
			const w1 = size - borderWidth;
			const h1 = shape === 'rectangle' ? size * 0.6 - borderWidth : size - borderWidth;
			const x1 = borderWidth / 2;
			const y1 = shape === 'rectangle' ? (size - h1) / 2 : borderWidth / 2;
			const w2 = size - borderWidth * 3;
			const h2 = shape === 'rectangle' ? size * 0.6 - borderWidth * 3 : size - borderWidth * 3;
			const x2 = borderWidth * 1.5;
			const y2 = shape === 'rectangle' ? (size - h2) / 2 : borderWidth * 1.5;
			borderElement = `
				<rect x="${x1}" y="${y1}" width="${w1}" height="${h1}" fill="none" stroke="${inkColor}" stroke-width="${borderWidth * 0.5}"/>
				<rect x="${x2}" y="${y2}" width="${w2}" height="${h2}" fill="none" stroke="${inkColor}" stroke-width="${borderWidth * 0.5}"/>
			`;
		}
	} else if (borderType === 'thick') {
		const thickWidth = borderWidth * 2.5;
		if (shape === 'round' || shape === 'oval') {
			const rx = size / 2 - thickWidth / 2;
			const ry = shape === 'round' ? rx : size * 0.3 - thickWidth / 2;
			borderElement = `<ellipse cx="${size / 2}" cy="${size / 2}" rx="${rx}" ry="${ry}" fill="none" stroke="${inkColor}" stroke-width="${thickWidth}"/>`;
		} else {
			const bw = shape === 'rectangle' ? size - thickWidth : size - thickWidth;
			const bh = shape === 'rectangle' ? size * 0.6 - thickWidth : size - thickWidth;
			const bx = thickWidth / 2;
			const by = shape === 'rectangle' ? (size - bh) / 2 : thickWidth / 2;
			borderElement = `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="${inkColor}" stroke-width="${thickWidth}"/>`;
		}
	}

	const charElements: string[] = [];
	const charPositions: CharacterPosition[] = [];

	for (let i = 0; i < charCount; i++) {
		const row = Math.floor(i / cols);
		const col = i % cols;
		const x = padding + col * charWidth + charWidth / 2;
		const y = padding + row * charHeight + charHeight / 2;
		const fontSize = Math.min(charWidth, charHeight) * 0.65;

		const char = characters[i] || '';
		charElements.push(`
			<text x="${x}" y="${y + fontSize * 0.35}" text-anchor="middle" 
				font-family="'STKaiti', 'KaiTi', 'SimSun', serif"
				font-size="${fontSize}px" fill="${textColor}" 
				style="font-weight: bold;">${char}</text>
		`);

		charPositions.push({
			index: i,
			character: char,
			x,
			y,
			width: charWidth * 0.8,
			height: charHeight * 0.8,
			rotation: 0,
			strokeCount: Math.floor(Math.random() * 8) + 4
		});
	}

	let textureElements = '';
	if (scriptType === 'zhuwen') {
		for (let i = 0; i < 20; i++) {
			const rx = Math.random() * size;
			const ry = Math.random() * size;
			const rsize = Math.random() * 3 + 1;
			textureElements += `<circle cx="${rx}" cy="${ry}" r="${rsize}" fill="${inkColor}" opacity="0.15"/>`;
		}
	}

	let gStart = '<g>';
	let gEnd = '</g>';
	if (clipPath) {
		gStart = `<g clip-path="url(#sealClip)">`;
	}

	const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
	<defs>
		${clipPath}
	</defs>
	${shapeElement}
	${gStart}
		${textureElements}
		${borderElement}
		${charElements.join('')}
	${gEnd}
</svg>`.trim();

	return svg;
}

export function generateBorderAssessment(borderType: BorderType): BorderAssessment {
	const breakages: number[] = [];
	if (borderType === 'broken') {
		breakages.push(Math.floor(Math.random() * 3) + 1);
	}

	return {
		type: borderType,
		thickness: Math.random() * 3 + 1,
		breakages,
		cornerTreatment: borderType === 'thick' ? '方笔厚重' : '圆转自然',
		balanceScore: Math.floor(Math.random() * 20) + 75,
		notes: borderType === 'double'
			? '双边设计，内外边粗细协调，需注意间距均匀'
			: borderType === 'broken'
			? '残破边栏，古意盎然，需注意破而不散'
			: '边栏工整，与印文协调统一'
	};
}

export function generateZhuBaiAnalysis(scriptType: SealScriptType, charCount: number): ZhuBaiAnalysis {
	const baseRatio = scriptType === 'zhuwen' ? 0.4 : scriptType === 'baiwen' ? 0.6 : 0.5;
	const variance = (Math.random() - 0.5) * 0.1;
	const zhuRatio = scriptType === 'mixed' ? 0.5 + variance : baseRatio + variance;
	const baiRatio = 1 - zhuRatio;

	return {
		type: scriptType,
		zhuRatio: Math.round(zhuRatio * 100) / 100,
		baiRatio: Math.round(baiRatio * 100) / 100,
		contrastScore: Math.floor(Math.random() * 15) + 80,
		balanceScore: Math.floor(Math.random() * 20) + 70,
		strokeDistribution: {
			top: Math.floor(Math.random() * 20) + 20,
			bottom: Math.floor(Math.random() * 20) + 20,
			left: Math.floor(Math.random() * 20) + 20,
			right: Math.floor(Math.random() * 20) + 20,
			center: Math.floor(Math.random() * 20) + 20
		},
		notes: charCount > 4
			? '多字印，朱白分布需注意整体协调'
			: '少字印，朱白对比鲜明，布局舒展'
	};
}

export function generateDensityAssessment(charCount: number): DensityAssessment {
	const levels: DensityLevel[] = ['very_sparse', 'sparse', 'balanced', 'dense', 'very_dense'];
	const levelIndex = Math.min(Math.floor(charCount / 3), 4);
	const overallLevel = levels[levelIndex];

	return {
		overallLevel,
		zones: [
			{ name: '左上', level: levels[Math.max(0, levelIndex - 1)], strokeCount: Math.floor(Math.random() * 10) + 5, areaRatio: 0.25 },
			{ name: '右上', level: levels[levelIndex], strokeCount: Math.floor(Math.random() * 10) + 5, areaRatio: 0.25 },
			{ name: '左下', level: levels[Math.min(4, levelIndex + 1)], strokeCount: Math.floor(Math.random() * 10) + 5, areaRatio: 0.25 },
			{ name: '右下', level: levels[levelIndex], strokeCount: Math.floor(Math.random() * 10) + 5, areaRatio: 0.25 }
		],
		balanceScore: Math.floor(Math.random() * 25) + 70,
		zhuDensity: levels[levelIndex],
		baiDensity: levels[3 - levelIndex],
		notes: overallLevel === 'balanced'
			? '疏密得当，虚实相生'
			: overallLevel === 'dense' || overallLevel === 'very_dense'
			? '布局茂密，需注意透气'
			: '布局疏朗，需注意神聚'
	};
}

export function generateKnifeTechniqueSuggestion(charCount: number): KnifeTechniqueSuggestion {
	const techniques: KnifeTechnique[] = ['chongdao', 'qiedao', 'liuidao', 'chuodao', 'mixed'];
	const recommended = techniques[Math.floor(Math.random() * techniques.length)];
	const alternatives = techniques.filter((t) => t !== recommended).slice(0, 2);

	return {
		recommended,
		alternatives,
		strokeAnalysis: {
			totalStrokes: charCount * (Math.floor(Math.random() * 5) + 6),
			averageWidth: Math.random() * 2 + 1,
			widthVariance: Math.random() * 0.5 + 0.2,
			cornerCount: Math.floor(Math.random() * 10) + 5,
			turningCount: Math.floor(Math.random() * 8) + 3
		},
		forceDistribution: {
			heavy: Math.floor(Math.random() * 30) + 20,
			medium: Math.floor(Math.random() * 30) + 40,
			light: Math.floor(Math.random() * 20) + 20
		},
		difficultyLevel: Math.floor(Math.random() * 3) + 2,
		suggestions: [
			'起刀宜稳，注意刀随笔转',
			'交叉处需注意留白',
			'收刀要干脆利落'
		],
		warnings: charCount > 6
			? ['多字印注意整体协调，刀法宜统一']
			: ['少字印注意每笔质量']
	};
}

export function getTechniqueName(tech: KnifeTechnique): string {
	const names: Record<KnifeTechnique, string> = {
		chongdao: '冲刀法',
		qiedao: '切刀法',
		liuidao: '留刀法',
		chuodao: '戳刀法',
		mixed: '混合刀法'
	};
	return names[tech];
}

export function getDensityName(level: DensityLevel): string {
	const names: Record<DensityLevel, string> = {
		very_sparse: '极疏',
		sparse: '疏',
		balanced: '适中',
		dense: '密',
		very_dense: '极密'
	};
	return names[level];
}

export function getBorderName(type: BorderType): string {
	const names: Record<BorderType, string> = {
		none: '无边',
		single: '单边',
		double: '双边',
		broken: '残破边',
		thick: '粗边',
		patterned: '花纹边'
	};
	return names[type];
}

export function getScriptTypeName(type: SealScriptType): string {
	const names: Record<SealScriptType, string> = {
		zhuwen: '朱文（阳刻）',
		baiwen: '白文（阴刻）',
		mixed: '朱白相间'
	};
	return names[type];
}
