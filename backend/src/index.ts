import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { LEVELS, getLevelById } from "./data/levels";
import { settleGame, SettleInputStep } from "./engine/settlement";
import { GameLevel, GameLevelId, GameField, GameEvent } from "@cbcp/shared";

const PORT = 41621;
const app = express();

app.use(cors());
app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, "..", "public");
app.use(express.static(PUBLIC_DIR));
app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

type LevelWithoutHiddenHints = Omit<GameLevel, "events"> & {
  events: Array<
    Omit<GameEvent, "trigger" | "message"> & {
      trigger: GameEvent["trigger"];
      message?: string;
    }
  >;
};

const sanitizeLevelForList = (level: any): LevelWithoutHiddenHints => {
  const events = level.events.map((e: GameEvent) => {
    if (e.type === "hidden") {
      return {
        ...e,
        message: undefined,
        trigger: {
          ...e.trigger,
          position: e.trigger.type === "position" ? undefined : e.trigger.position,
          step: e.trigger.type === "step" ? undefined : e.trigger.step,
          value: e.trigger.type === "value" ? undefined : e.trigger.value
        }
      };
    }
    return e;
  });
  return { ...level, events };
};

app.get("/api/levels", (_req: Request, res: Response) => {
  const sanitized = LEVELS.map(sanitizeLevelForList);
  res.json(sanitized);
});

app.get("/api/levels/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const level = getLevelById(id as GameLevelId);
  if (!level) {
    return res.status(404).json({ error: `关卡 ${id} 不存在` });
  }
  res.json(level);
});

interface SettleRequestBody {
  levelId: GameLevelId;
  steps: SettleInputStep[];
  initialField: GameField;
}

app.post(
  "/api/settle",
  (req: Request<{}, {}, SettleRequestBody>, res: Response, next: NextFunction) => {
    try {
      const { levelId, steps, initialField } = req.body;

      if (!levelId || !steps || !initialField) {
        return res
          .status(400)
          .json({ error: "缺少必要参数: levelId, steps, initialField" });
      }

      const level = getLevelById(levelId);
      if (!level) {
        return res.status(404).json({ error: `关卡 ${levelId} 不存在` });
      }

      if (!Array.isArray(steps)) {
        return res.status(400).json({ error: "steps 必须是数组" });
      }

      for (const fieldKey of [
        "trackSwitchValue",
        "translationSlot",
        "overwriteMark",
        "siRisk",
        "shenReward",
        "wuFailFactor"
      ] as const) {
        if (typeof initialField[fieldKey] !== "number") {
          return res
            .status(400)
            .json({ error: `initialField.${fieldKey} 必须是数字` });
        }
      }

      const result = settleGame(level, steps, initialField);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "接口不存在" });
});

app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[Server Error]", err);
    res.status(500).json({
      error: "服务器内部错误",
      message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
);

app.listen(PORT, () => {
  console.log(`CBCP Backend API listening on http://localhost:${PORT}`);
  console.log(`  GET  /api/levels       - 获取所有关卡列表`);
  console.log(`  GET  /api/levels/:id   - 获取指定关卡详情`);
  console.log(`  POST /api/settle       - 关卡结算`);
});
