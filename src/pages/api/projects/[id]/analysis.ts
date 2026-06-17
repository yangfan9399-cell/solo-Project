import type { APIRoute } from 'astro';
import { generateHarrisMatrix } from '../../../../lib/harrisMatrix';
import { detectAnomalies, getAnomalySummary } from '../../../../lib/anomalies';

export const GET: APIRoute = async ({ params, url }) => {
  const projectId = params.id;
  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Project ID required' }), { status: 400 });
  }
  try {
    const type = url.searchParams.get('type') || 'harris';
    let data;
    if (type === 'harris') {
      data = generateHarrisMatrix(projectId);
    } else if (type === 'anomalies') {
      const anomalies = detectAnomalies(projectId);
      data = {
        anomalies,
        summary: getAnomalySummary(anomalies)
      };
    } else {
      const harris = generateHarrisMatrix(projectId);
      const anomalies = detectAnomalies(projectId);
      data = {
        harris,
        anomalies,
        anomalySummary: getAnomalySummary(anomalies)
      };
    }
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to compute analysis' }), { status: 500 });
  }
};
