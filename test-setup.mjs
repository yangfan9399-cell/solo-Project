import Database from "better-sqlite3";
import { initGame, advanceTime, calculateSettlement, createAction, calculateTeaQuality, completeProcessing, scheduleBasketMove, calculateTravelTime
} from "./src/server/gameEngine.ts";
import { QUALITY_PRICES, SEED_DATA, minuteToTime
} from "./src/server/gameData.ts";
import { getActiveGame, setActiveGame, persistGameState, listSessions
} from "./src/server/gameStore.ts";

const db = new Database("./data/test-tea-garden.db");

console.log("测试种子数据:");
console.log("  normal种子 - 茶树数量:", SEED_DATA.normal.plants.length);
console.log("  normal种子 - 索道数量:", SEED_DATA.normal.cableways.length);

const state = initGame("normal", "测试局次");
console.log("\n初始化游戏后:");
console.log("  局次ID:", state.session.id);
console.log("  阶段:", state.session.phase);
console.log("  时间:", minuteToTime(state.session.currentTime));
console.log("  茶树数量:", state.plants.length);
console.log("  索道数量:", state.cableways.length);
console.log("  吊篮数量:", state.baskets.length);
console.log("  工位数量:", state.stations.length);

setActiveGame(state);
console.log("\n推进时间60分钟:");
const s2 = advanceTime(state, 60);
console.log("  新时间:", minuteToTime(s2.session.currentTime));
console.log("  山风强度:", s2.session.windIntensity);

const p = s2.plants[0];
const { quality, reason } = calculateTeaQuality(p, s2.session.currentTime);
console.log("\n茶树品质分析:");
console.log("  海拔:", p.altitude, "位置Y:", p.positionY);
console.log("  品质:", quality, "原因:", reason);

console.log("\n结算测试:");
setActiveGame(s2);
const before = calculateSettlement(s2, "before");
const after = calculateSettlement(s2, "after");
console.log("  结算前收益:", before.totalRevenue, "结算后收益:", after.totalRevenue);

console.log("\n所有测试通过!");
