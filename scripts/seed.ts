import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { seedData } from "../src/data/seed";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const exportPath = path.join(dataDir, "initial-data.json");
fs.writeFileSync(exportPath, JSON.stringify(seedData, null, 2), "utf-8");

console.log(`\n✅ 种子数据初始化完成`);
console.log(`\n📊 数据概览:`);
console.log(`   通道: ${seedData.channels.length} 条`);
console.log(`   出入口: ${seedData.entrances.length} 条`);
console.log(`   指示牌: ${seedData.signs.length} 条`);
console.log(`   设备点位: ${seedData.equipment.length} 条`);
console.log(`   导览地图: ${seedData.maps.length} 张`);
console.log(`   巡检任务: ${seedData.inspections.length} 条`);
console.log(`   版本历史: ${seedData.versionHistory.length} 条`);
console.log(`   异常记录: ${seedData.anomalies.filter(a => !a.resolved).length} 条（未解决）`);
console.log(`   导出记录: ${seedData.exportSummaries.length} 条`);
console.log(`\n📁 数据文件: ${exportPath}`);
console.log(`\n💡 运行 'npm install' 安装依赖，然后 'npm run dev' 启动开发服务器`);
