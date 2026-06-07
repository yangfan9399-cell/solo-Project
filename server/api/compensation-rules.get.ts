import { getCompensationRules } from '../db/mockData';

export default defineEventHandler(() => {
  return {
    success: true,
    data: getCompensationRules(),
  };
});
