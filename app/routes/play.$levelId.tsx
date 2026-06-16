import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigate, Form } from "@remix-run/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  getLevel,
  getSession,
  createSession,
  addAction,
  getActionHistory,
  completeSession,
  failSession,
  createWork,
  updatePlayerScore,
  getPlayer
} from "~/db.server";
import { calculateScore, isPassing } from "~/scoring.server";
import {
  createInitialState,
  applyAction,
  undo,
  redo,
  canUndo,
  canRedo,
  FONT_STYLES,
  type GameState
} from "~/game-state";

export const loader = async ({ params }: { params: { levelId: string } }) => {
  const level = await getLevel(params.levelId);
  if (!level) {
    throw new Response("Not Found", { status: 404 });
  }

  const sessionId = `session-${uuidv4()}`;
  const player = await getPlayer("player-local");
  if (!player) {
    throw new Response("Player not found", { status: 404 });
  }

  await createSession(sessionId, player.id, level.id);
  await addAction(sessionId, "session_start", { levelId: level.id });

  return json({ level, sessionId, playerId: player.id });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  if (actionType === "submit") {
    const sessionId = formData.get("sessionId") as string;
    const levelId = formData.get("levelId") as string;
    const playerId = formData.get("playerId") as string;
    const subtitleText = formData.get("subtitleText") as string;
    const fontStyle = formData.get("fontStyle") as string;
    const fontSize = parseInt(formData.get("fontSize") as string, 10);
    const timingStart = parseInt(formData.get("timingStart") as string, 10);
    const timingEnd = parseInt(formData.get("timingEnd") as string, 10);

    const level = await getLevel(levelId);
    if (!level) {
      return json({ error: "Level not found" }, { status: 404 });
    }

    const scoreResult = calculateScore(
      { subtitleText, fontStyle, fontSize, timingStart, timingEnd },
      level
    );

    await addAction(sessionId, "submit", {
      submission: { subtitleText, fontStyle, fontSize, timingStart, timingEnd },
      score: scoreResult
    });

    const passed = isPassing(scoreResult.total, level.min_score);

    if (passed) {
      await completeSession(sessionId, scoreResult.total);
      await updatePlayerScore(playerId, scoreResult.total);
      await createWork({
        player_id: playerId,
        level_id: levelId,
        session_id: sessionId,
        subtitle_text: subtitleText,
        font_style: fontStyle,
        font_size: fontSize,
        timing_start: timingStart,
        timing_end: timingEnd,
        score: scoreResult.total
      });
    } else {
      await failSession(sessionId);
    }

    return redirect(`/result/${sessionId}`);
  }

  if (actionType === "saveHistory") {
    const sessionId = formData.get("sessionId") as string;
    const historyData = formData.get("historyData") as string;
    await addAction(sessionId, "state_change", JSON.parse(historyData || "{}"));
    return json({ ok: true });
  }

  return json({ error: "Invalid action" }, { status: 400 });
};

export default function Play() {
  const { level, sessionId, playerId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState(level.duration)
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastSyncRef = useRef<number>(0);

  const syncHistoryToServer = useCallback(() => {
    const now = Date.now();
    if (now - lastSyncRef.current < 1000) return;
    lastSyncRef.current = now;

    const formData = new FormData();
    formData.append("actionType", "saveHistory");
    formData.append("sessionId", sessionId);
    formData.append(
      "historyData",
      JSON.stringify({
        subtitleText: gameState.subtitleText,
        fontStyle: gameState.fontStyle,
        fontSize: gameState.fontSize,
        timingStart: gameState.timingStart,
        timingEnd: gameState.timingEnd
      })
    );

    fetch("/play/" + level.id, {
      method: "POST",
      body: formData
    }).catch(() => {});
  }, [sessionId, level.id, gameState]);

  useEffect(() => {
    if (gameState.history.length > 0) {
      syncHistoryToServer();
    }
  }, [gameState.history.length, syncHistoryToServer]);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = performance.now() - currentTime;

      const animate = () => {
        const elapsed = performance.now() - startTimeRef.current;
        setCurrentTime(elapsed);

        const shouldShow =
          elapsed >= gameState.timingStart && elapsed <= gameState.timingEnd;
        setShowSubtitle(shouldShow);

        if (elapsed >= level.duration) {
          setIsPlaying(false);
          setCurrentTime(level.duration);
          setShowSubtitle(false);
          return;
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, level.duration, gameState.timingStart, gameState.timingEnd]);

  const handlePlay = () => {
    if (currentTime >= level.duration) {
      setCurrentTime(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setShowSubtitle(false);
  };

  const handleTextChange = (value: string) => {
    setGameState((prev) => applyAction(prev, "text", { subtitleText: value }));
  };

  const handleFontStyleChange = (value: string) => {
    setGameState((prev) => applyAction(prev, "fontStyle", { fontStyle: value }));
  };

  const handleFontSizeChange = (value: number) => {
    setGameState((prev) => applyAction(prev, "fontSize", { fontSize: value }));
  };

  const handleTimingStartChange = (value: number) => {
    setGameState((prev) =>
      applyAction(prev, "timingStart", {
        timingStart: Math.min(value, prev.timingEnd - 200)
      })
    );
  };

  const handleTimingEndChange = (value: number) => {
    setGameState((prev) =>
      applyAction(prev, "timingEnd", {
        timingEnd: Math.max(value, prev.timingStart + 200)
      })
    );
  };

  const handleUndo = () => {
    setGameState((prev) => undo(prev));
  };

  const handleRedo = () => {
    setGameState((prev) => redo(prev));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === " " && !e.repeat) {
        e.preventDefault();
        if (isPlaying) {
          handlePause();
        } else {
          handlePlay();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, gameState]);

  const currentFont = FONT_STYLES.find((f) => f.id === gameState.fontStyle);

  const progress = (currentTime / level.duration) * 100;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      padding: "1rem"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
          padding: "0.5rem 0"
        }}>
          <button
            onClick={() => navigate("/levels")}
            style={{
              background: "none",
              border: "none",
              color: "var(--sepia-dark)",
              cursor: "pointer",
              fontSize: "0.9rem"
            }}
          >
            ← 返回关卡
          </button>
          <h2 style={{ color: "var(--sepia)", fontSize: "1.2rem" }}>
            第 {level.id.replace("level-", "")} 幕 · {level.title}
          </h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleUndo}
              disabled={!canUndo(gameState)}
              style={{
                padding: "0.4rem 0.8rem",
                background: "var(--film-bg)",
                border: "1px solid var(--film-border)",
                color: canUndo(gameState) ? "var(--sepia)" : "var(--film-border)",
                cursor: canUndo(gameState) ? "pointer" : "not-allowed",
                fontSize: "0.85rem"
              }}
            >
              撤销
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo(gameState)}
              style={{
                padding: "0.4rem 0.8rem",
                background: "var(--film-bg)",
                border: "1px solid var(--film-border)",
                color: canRedo(gameState) ? "var(--sepia)" : "var(--film-border)",
                cursor: canRedo(gameState) ? "pointer" : "not-allowed",
                fontSize: "0.85rem"
              }}
            >
              重做
            </button>
          </div>
        </div>

        <div style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          background: `
            radial-gradient(ellipse at center, #3a3028 0%, #1a1510 70%),
            linear-gradient(180deg, #2a2520 0%, #1a1510 100%)
          `,
          border: "3px solid var(--film-border)",
          marginBottom: "1rem",
          overflow: "hidden",
          borderRadius: "4px"
        }}>
          <div style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            color: "var(--sepia-dark)",
            fontSize: "0.9rem",
            fontStyle: "italic",
            textAlign: "center",
            width: "80%",
            opacity: 0.5
          }}>
            {level.scene_description}
          </div>

          <div style={{
            position: "absolute",
            bottom: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "80%",
            textAlign: "center",
            opacity: showSubtitle ? 1 : 0,
            transition: "opacity 0.15s ease"
          }}>
            <div
              style={{
                display: "inline-block",
                background: "rgba(0, 0, 0, 0.85)",
                padding: "1rem 2rem",
                border: "2px solid var(--sepia)",
                fontFamily: currentFont?.fontFamily,
                fontSize: `${gameState.fontSize}px`,
                color: "var(--sepia)",
                lineHeight: "1.4",
                whiteSpace: "pre-line",
                fontWeight: gameState.fontStyle.includes("bold") ? "bold" : "normal",
                fontStyle: gameState.fontStyle.includes("italic") ? "italic" : "normal",
                textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                letterSpacing: "0.02em"
              }}
            >
              {gameState.subtitleText || "输入字幕..."}
            </div>
          </div>

          <div style={{
            position: "absolute",
            bottom: "1rem",
            right: "1rem",
            color: "var(--sepia-dark)",
            fontSize: "0.8rem",
            fontFamily: "monospace"
          }}>
            {(currentTime / 1000).toFixed(2)}s / {(level.duration / 1000).toFixed(2)}s
          </div>

          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "4px",
            background: "rgba(0,0,0,0.5)"
          }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "var(--accent)",
              transition: "width 0.05s linear"
            }} />
          </div>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "1.5rem"
        }}>
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              style={{
                padding: "0.6rem 2rem",
                background: "var(--accent)",
                color: "#1a1a1a",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold"
              }}
            >
              ▶ 播放 (空格)
            </button>
          ) : (
            <button
              onClick={handlePause}
              style={{
                padding: "0.6rem 2rem",
                background: "var(--sepia-dark)",
                color: "#1a1a1a",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold"
              }}
            >
              ⏸ 暂停 (空格)
            </button>
          )}
          <button
            onClick={handleReset}
            style={{
              padding: "0.6rem 1.5rem",
              background: "var(--film-bg)",
              color: "var(--sepia)",
              border: "1px solid var(--film-border)",
              cursor: "pointer",
              fontSize: "1rem"
            }}
          >
            ↺ 重置
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginBottom: "1.5rem"
        }}>
          <div style={{
            background: "var(--film-bg)",
            border: "1px solid var(--film-border)",
            padding: "1.5rem"
          }}>
            <h3 style={{
              color: "var(--sepia)",
              fontSize: "1rem",
              marginBottom: "1rem"
            }}>
              字幕文案
            </h3>
            <textarea
              value={gameState.subtitleText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="在这里输入字幕文案..."
              style={{
                width: "100%",
                height: "120px",
                background: "#1a1510",
                border: "1px solid var(--film-border)",
                color: "var(--sepia)",
                padding: "0.8rem",
                fontSize: "1rem",
                lineHeight: "1.5",
                resize: "vertical",
                fontFamily: "inherit"
              }}
            />
            <p style={{
              marginTop: "0.5rem",
              fontSize: "0.75rem",
              color: "var(--sepia-dark)"
            }}>
              提示：仔细体会场景情绪，用简洁有力的文字表达
            </p>
          </div>

          <div style={{
            background: "var(--film-bg)",
            border: "1px solid var(--film-border)",
            padding: "1.5rem"
          }}>
            <h3 style={{
              color: "var(--sepia)",
              fontSize: "1rem",
              marginBottom: "1rem"
            }}>
              字体样式
            </h3>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{
                display: "block",
                color: "var(--sepia-dark)",
                fontSize: "0.85rem",
                marginBottom: "0.5rem"
              }}>
                字体
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {FONT_STYLES.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => handleFontStyleChange(font.id)}
                    style={{
                      padding: "0.4rem 0.8rem",
                      background:
                        gameState.fontStyle === font.id
                          ? "var(--accent)"
                          : "transparent",
                      color:
                        gameState.fontStyle === font.id
                          ? "#1a1a1a"
                          : "var(--sepia)",
                      border: "1px solid var(--film-border)",
                      cursor: "pointer",
                      fontFamily: font.fontFamily,
                      fontSize: "0.85rem"
                    }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{
                display: "block",
                color: "var(--sepia-dark)",
                fontSize: "0.85rem",
                marginBottom: "0.5rem"
              }}>
                字号: {gameState.fontSize}px
              </label>
              <input
                type="range"
                min="24"
                max="72"
                value={gameState.fontSize}
                onChange={(e) => handleFontSizeChange(parseInt(e.target.value, 10))}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>

        <div style={{
          background: "var(--film-bg)",
          border: "1px solid var(--film-border)",
          padding: "1.5rem",
          marginBottom: "1.5rem"
        }}>
          <h3 style={{
            color: "var(--sepia)",
            fontSize: "1rem",
            marginBottom: "1rem"
          }}>
            出现时机
          </h3>

          <div style={{
            position: "relative",
            height: "60px",
            background: "#1a1510",
            border: "1px solid var(--film-border)",
            marginBottom: "1rem",
            borderRadius: "4px"
          }}>
            <div style={{
              position: "absolute",
              left: `${(gameState.timingStart / level.duration) * 100}%`,
              top: 0,
              bottom: 0,
              width: "3px",
              background: "var(--accent)",
              cursor: "ew-resize",
              zIndex: 2
            }}>
              <div style={{
                position: "absolute",
                top: "50%",
                left: "-0.6rem",
                transform: "translateY(-50%)",
                width: "1.2rem",
                height: "1.2rem",
                background: "var(--accent)",
                borderRadius: "50%",
                border: "2px solid #1a1a1a"
              }} />
            </div>

            <div style={{
              position: "absolute",
              left: `${(gameState.timingStart / level.duration) * 100}%`,
              right: `${100 - (gameState.timingEnd / level.duration) * 100}%`,
              top: "10px",
              bottom: "10px",
              background: "rgba(212, 165, 116, 0.3)",
              borderTop: "2px dashed var(--accent)",
              borderBottom: "2px dashed var(--accent)",
              zIndex: 1
            }} />

            <div style={{
              position: "absolute",
              left: `${(gameState.timingEnd / level.duration) * 100}%`,
              top: 0,
              bottom: 0,
              width: "3px",
              background: "var(--accent)",
              cursor: "ew-resize",
              zIndex: 2
            }}>
              <div style={{
                position: "absolute",
                top: "50%",
                right: "-0.6rem",
                transform: "translateY(-50%)",
                width: "1.2rem",
                height: "1.2rem",
                background: "var(--accent)",
                borderRadius: "50%",
                border: "2px solid #1a1a1a"
              }} />
            </div>

            <div style={{
              position: "absolute",
              bottom: "-1.5rem",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.7rem",
              color: "var(--sepia-dark)"
            }}>
              <span>0s</span>
              <span>{(level.duration / 2000).toFixed(1)}s</span>
              <span>{(level.duration / 1000).toFixed(1)}s</span>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginTop: "2rem"
          }}>
            <div>
              <label style={{
                display: "block",
                color: "var(--sepia-dark)",
                fontSize: "0.85rem",
                marginBottom: "0.5rem"
              }}>
                开始时间: {(gameState.timingStart / 1000).toFixed(2)}s
              </label>
              <input
                type="range"
                min="0"
                max={level.duration - 200}
                step="50"
                value={gameState.timingStart}
                onChange={(e) =>
                  handleTimingStartChange(parseInt(e.target.value, 10))
                }
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{
                display: "block",
                color: "var(--sepia-dark)",
                fontSize: "0.85rem",
                marginBottom: "0.5rem"
              }}>
                结束时间: {(gameState.timingEnd / 1000).toFixed(2)}s
              </label>
              <input
                type="range"
                min="200"
                max={level.duration}
                step="50"
                value={gameState.timingEnd}
                onChange={(e) =>
                  handleTimingEndChange(parseInt(e.target.value, 10))
                }
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <Form method="post">
            <input type="hidden" name="actionType" value="submit" />
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="levelId" value={level.id} />
            <input type="hidden" name="playerId" value={playerId} />
            <input type="hidden" name="subtitleText" value={gameState.subtitleText} />
            <input type="hidden" name="fontStyle" value={gameState.fontStyle} />
            <input type="hidden" name="fontSize" value={gameState.fontSize} />
            <input type="hidden" name="timingStart" value={gameState.timingStart} />
            <input type="hidden" name="timingEnd" value={gameState.timingEnd} />

            <button
              type="submit"
              style={{
                padding: "1rem 3rem",
                background: "var(--accent)",
                color: "#1a1a1a",
                border: "2px solid var(--accent-dark)",
                cursor: "pointer",
                fontSize: "1.2rem",
                fontWeight: "bold",
                letterSpacing: "0.1em"
              }}
            >
              提交作品
            </button>
          </Form>
          <p style={{
            marginTop: "0.75rem",
            fontSize: "0.75rem",
            color: "var(--sepia-dark)"
          }}>
            提交后将由评委评分 · 及格线 {level.min_score} 分
          </p>
        </div>
      </div>
    </div>
  );
}
