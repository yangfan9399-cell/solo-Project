import { initDatabase, getRequisitionWithDetails, getStatisticsByCategory, getOverdueStatistics } from "./app/db/queries";

async function test() {
  await initDatabase();
  
  console.log("=== 测试1: getRequisitionWithDetails (归还记录核验人");
  const details = await getRequisitionWithDetails(1);
  console.log("归还记录:", JSON.stringify(details?.returns, null, 2));
  console.log("操作历史:", JSON.stringify(details?.logs?.slice(0, 2), null, 2));
  
  console.log("\n=== 测试2: getStatisticsByCategory");
  const byCategory = await getStatisticsByCategory();
  console.log("按类别统计:", JSON.stringify(byCategory, null, 2));
  
  console.log("\n=== 测试3: getOverdueStatistics");
  const overdue = await getOverdueStatistics();
  console.log("逾期记录:", JSON.stringify(overdue, null, 2));
}

test().catch(console.error);
