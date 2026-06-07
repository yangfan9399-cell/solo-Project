import { getCleaners } from '../db/mockData';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const city = query.city as string;
  let cleaners = getCleaners();
  if (city) {
    cleaners = cleaners.filter(c => c.city === city);
  }
  return {
    success: true,
    data: cleaners,
  };
});
