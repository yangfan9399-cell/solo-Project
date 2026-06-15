import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

import("./src/server/gameData.ts")
  .then((data) => {
    console.log("=== 1. 游戏数据加载 ===");
    console.log("  normal种子植物数:", data.SEED_DATA.normal.plants.length);
    console.log("  特级价格:", data.QUALITY_PRICES.premium);
    
    return import("./src/server/db.ts").then(() => data);
  })
  .then((data) => {
    console.log("\n=== 2. 数据库初始化 ===");
    const db = new Database("./data/tea-garden.db");
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all();
    console.log("  数据表:", tables.map(t => t.name).join(", "));
    db.close();
    return data;
  })
  .then((data) => {
    console.log("\n=== 3. 游戏引擎加载 ===");
    return import("./src/server/gameEngine.ts").then((engine) => ({ data, engine }));
  })
  .then(({ data, engine }) => {
    console.log("  可用函数:", Object.keys(engine).join(", "));
    console.log("\n=== 4. 初始化游戏 ===");
    const state = engine.initGame("normal", "测试");
    console.log("  局次:", state.session.name);
    console.log("  初始时间:", data.minuteToTime(state.session.currentTime));
    console.log("  茶树数:", state.plants.length);
    console.log("  索道数:", state.cableways.length);
    console.log("  吊篮数:", state.baskets.length);
    console.log("  工位数:", state.stations.length);

    console.log("\n=== 5. 推进时间 ===");
    const s2 = engine.advanceTime(state, 120);
    console.log("  新时间:", data.minuteToTime(s2.session.currentTime));
    console.log("  山风强度:", s2.session.windIntensity);
    console.log("  冲突数:", s2.conflicts.length);

    console.log("\n=== 6. 品质分析 ===");
    s2.plants.forEach((p, i) => {
      if (i < 3) {
        const q = engine.calculateTeaQuality(p, s2.session.currentTime);
        console.log(`  茶树${i + 1} (${p.altitude}海拔): ${q.quality} - ${q.reason}`);
      }
    });

    console.log("\n=== 7. 结算重算 ===");
    return import("./src/server/gameStore.ts").then((store) => {
      store.setActiveGame(s2);
      const before = engine.calculateSettlement(s2, "before");
      const after = engine.calculateSettlement(s2, "after");
      console.log("  结算前收益:", before.totalRevenue);
      console.log("  结算后收益:", after.totalRevenue);
      console.log("  差异:", after.totalRevenue - before.totalRevenue);
    });
  })
  .then(() => {
    console.log("\n✅ 所有核心测试通过!");
  })
  .catch((err) => {
    console.error("❌ 测试失败:", err.message);
    console.error(err.stack);
    process.exit(1);
  });
