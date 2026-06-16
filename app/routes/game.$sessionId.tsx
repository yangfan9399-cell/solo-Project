import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@remix-run/react";
import { GameBoard } from "~/components/GameBoard";
import type {
  ExhibitDef,
  GameSession,
  LevelConfig,
  LightSource,
  PlacedExhibit,
} from "~/types";

export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<GameSession | null>(null);
  const [level, setLevel] = useState<LevelConfig | null>(null);
  const [exhibitDefs, setExhibitDefs] = useState<Record<string, ExhibitDef>>({});
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    loadData();
  }, [sessionId]);

  async function loadData() {
    setLoading(true);
    const [sRes, lDefsRes] = await Promise.all([
      fetch(`/api/sessions?id=${sessionId}&ops=1`).then((r) => r.json()),
      fetch("/api/levels").then((r) => r.json()),
    ]);

    if (sRes.session) {
      setSession(sRes.session);
      const lvRes = await fetch(`/api/levels?id=${sRes.session.levelId}`).then((r) => r.json());
      setLevel(lvRes.level);
    }

    const defs: Record<string, ExhibitDef> = {};
    for (const lv of lDefsRes.levels || []) {
      for (const exId of lv.availableExhibits) {
        if (!defs[exId]) {
          defs[exId] = {
            id: exId,
            type: exId.startsWith("paint")
              ? "painting"
              : exId.startsWith("sculpt")
              ? "sculpture"
              : exId.startsWith("relic")
              ? "relic"
              : "photograph",
            name: exId,
            lightMin: 30,
            lightMax: 60,
            sensitivity: 1,
            size: { w: 2, h: 2 },
          };
        }
      }
    }

    const exhibitResponse = await fetch("/api/score", {
      method: "POST",
      body: (() => {
        const fd = new FormData();
        fd.append("sessionId", sessionId!);
        fd.append("exhibits", JSON.stringify([]));
        fd.append("lights", JSON.stringify([]));
        return fd;
      })(),
    }).then((r) => r.json());

    if (exhibitResponse.exhibitDetails) {
      setExhibitDefs(exhibitDefs);
    }

    const manualDefs: Record<string, ExhibitDef> = {
      "paint-mona": {
        id: "paint-mona",
        type: "painting",
        name: "古典油画",
        lightMin: 30,
        lightMax: 60,
        sensitivity: 1.2,
        size: { w: 2, h: 2 },
      },
      "sculpt-bust": {
        id: "sculpt-bust",
        type: "sculpture",
        name: "大理石雕塑",
        lightMin: 40,
        lightMax: 80,
        sensitivity: 0.8,
        size: { w: 2, h: 2 },
      },
      "relic-vase": {
        id: "relic-vase",
        type: "relic",
        name: "古代瓷瓶",
        lightMin: 20,
        lightMax: 45,
        sensitivity: 1.5,
        size: { w: 1, h: 2 },
      },
      "photo-bw": {
        id: "photo-bw",
        type: "photograph",
        name: "历史照片",
        lightMin: 15,
        lightMax: 35,
        sensitivity: 1.8,
        size: { w: 2, h: 1 },
      },
      "paint-water": {
        id: "paint-water",
        type: "painting",
        name: "水彩画",
        lightMin: 20,
        lightMax: 40,
        sensitivity: 1.6,
        size: { w: 2, h: 2 },
      },
      "relic-scroll": {
        id: "relic-scroll",
        type: "relic",
        name: "古卷轴",
        lightMin: 10,
        lightMax: 25,
        sensitivity: 2.0,
        size: { w: 3, h: 1 },
      },
    };
    setExhibitDefs(manualDefs);

    setLoading(false);
  }

  async function handleApply(
    exhibits: PlacedExhibit[],
    lights: LightSource[],
    opType: string,
    opData: Record<string, unknown>
  ) {
    const fd = new FormData();
    fd.append("intent", "apply");
    fd.append("sessionId", sessionId!);
    fd.append("opType", opType);
    fd.append("exhibits", JSON.stringify(exhibits));
    fd.append("lights", JSON.stringify(lights));
    fd.append("opData", JSON.stringify(opData));
    await fetch("/api/sessions", { method: "POST", body: fd });
  }

  async function handleComplete(score: number) {
    setFinalScore(score);
    const fd = new FormData();
    fd.append("intent", "complete");
    fd.append("sessionId", sessionId!);
    fd.append("status", score >= (level?.targetScore ?? 60) ? "completed" : "failed");
    fd.append("score", String(score));
    await fetch("/api/sessions", { method: "POST", body: fd });
    setShowResult(true);
  }

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#888" }}>
        加载游戏中...
      </div>
    );
  }

  if (!session || !level) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <p style={{ color: "#ff8888", marginBottom: 16 }}>找不到该游戏局次</p>
        <button onClick={() => navigate("/")} style={{ ...btnStyle(), background: "#4a7cff" }}>
          返回首页
        </button>
      </div>
    );
  }

  if (showResult) {
    const passed = finalScore >= level.targetScore;
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          style={{
            background: "#151520",
            borderRadius: 16,
            padding: 48,
            border: "1px solid #252535",
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>{passed ? "🎉" : "😔"}</div>
          <h1 style={{ fontSize: 28, marginBottom: 8, color: passed ? "#88ffaa" : "#ff8888" }}>
            {passed ? "布展成功！" : "布展失败"}
          </h1>
          <p style={{ color: "#888", marginBottom: 24 }}>{level.name}</p>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: "#aaa", marginBottom: 4 }}>最终得分</div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: passed ? "#88ffaa" : "#ffaa66",
              }}
            >
              {finalScore}
            </div>
            <div style={{ fontSize: 14, color: "#666" }}>
              目标: {level.targetScore} 分
            </div>
          </div>

          {passed ? (
            <p style={{ color: "#aaa", marginBottom: 32, lineHeight: 1.6 }}>
              恭喜！所有展品都在适宜的光线下安全展出。
              <br />
              博物馆会感谢你的专业布展！
            </p>
          ) : (
            <p style={{ color: "#aaa", marginBottom: 32, lineHeight: 1.6 }}>
              部分展品的照明条件不够理想。
              <br />
              请调整灯光位置和强度，确保每件展品都在适宜的光照范围内。
            </p>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => navigate("/")}
              style={{ ...btnStyle(), flex: 1, background: "#333" }}
            >
              返回首页
            </button>
            {!passed && (
              <button
                onClick={() => {
                  setShowResult(false);
                }}
                style={{ ...btnStyle(), flex: 1, background: "#4a7cff" }}
              >
                继续调整
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, height: "100vh", overflow: "auto" }}>
      <GameBoard
        level={level}
        exhibitDefs={exhibitDefs}
        session={session}
        onApply={handleApply}
        onComplete={handleComplete}
        onQuit={() => navigate("/")}
      />
    </div>
  );
}

function btnStyle() {
  return {
    padding: "12px 20px",
    borderRadius: 8,
    border: "none",
    color: "#fff",
    fontSize: 15,
    cursor: "pointer" as const,
  };
}
