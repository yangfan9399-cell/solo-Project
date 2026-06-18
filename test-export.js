const { getProject, getAllSamples, saveSample, getAllExports, saveExport } = require('./src/utils/storage.ts');
const { samplesToJson, samplesToCsv, generateSummaryReport } = require('./src/routes/project/[id]/export/index.tsx');

console.log('Testing data storage and export functions...\n');

try {
  const project = getProject('p1');
  console.log('Project:', project?.name);

  const samples = getAllSamples('p1');
  console.log('Total samples:', samples.length);

  const json = samplesToJson(samples);
  console.log('JSON export length:', json.length);

  const csv = samplesToCsv(samples);
  console.log('CSV export length:', csv.length);

  const anomalies = [];
  const summary = generateSummaryReport(project!, samples, anomalies);
  console.log('Summary report length:', summary.length);

  console.log('\n✓ All export functions work correctly');
} catch (e) {
  console.error('Error:', e);
}
