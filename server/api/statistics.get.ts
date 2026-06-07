import { getStatistics } from '../db/mockData';

export default defineEventHandler(() => {
  const stats = getStatistics();
  return {
    success: true,
    data: stats,
  };
});
