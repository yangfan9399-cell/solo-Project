import { NextResponse } from 'next/server';
import { getProjectById, getRecipesByProject } from '@/lib/data-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || '';
  const format = (searchParams.get('format') || 'json') as 'json' | 'csv';

  try {
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const recipes = await getRecipesByProject(projectId);

    const summary = {
      totalRecipes: recipes.length,
      totalVersions: recipes.reduce((sum, r) => sum + r.versions.length, 0),
      totalSpecimens: recipes.reduce((sum, r) => sum + r.versions.reduce((s, v) => s + v.specimens.length, 0), 0),
      temperatureRange: {
        min: Math.min(...recipes.flatMap(r => r.versions.map(v => v.firingTemperature))),
        max: Math.max(...recipes.flatMap(r => r.versions.map(v => v.firingTemperature))),
      },
    };

    if (format === 'csv') {
      const csvLines = generateCsv(recipes);
      return new NextResponse(csvLines, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${project.code}_export.csv`,
        },
      });
    }

    const exportData = {
      project,
      recipes,
      exportedAt: new Date().toISOString(),
      format: 'json',
      summary,
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="${project.code}_export.json`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Export failed', details: String(error) },
      { status: 500 }
    );
  }
}

function generateCsv(recipes: any[]): string {
  const headers = [
    '配方编号', '配方名称', '版本号', '批次号', '烧成温度(°C)',
    '烧成气氛', '保温时间(分钟)', '原料成分', '总百分比', '试片数量', '创建时间', '备注'
  ];

  const rows: string[] = [headers.join(',')];

  recipes.forEach(recipe => {
    recipe.versions.forEach((version: any) => {
      const componentsStr = version.components
        .map((c: any) => `${c.ingredientName}:${c.percentage}%`)
        .join('; ');

      const row = [
        recipe.code,
        recipe.name,
        `v${version.versionNumber}`,
        version.batchNumber || '',
        version.firingTemperature,
        version.firingType,
        version.holdTime,
        `"${componentsStr}"`,
        version.totalPercentage,
        version.specimens.length,
        version.createdAt,
        `"${version.changeNotes || ''}"`,
      ].join(',');

      rows.push(row);
    });
  });

  return rows.join('\n');
}
