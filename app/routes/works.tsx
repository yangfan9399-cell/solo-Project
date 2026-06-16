import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getPlayer, getPlayerWorks, getAllLevels, type Work, type Level, type Player } from "~/db.server";
import { FONT_STYLES } from "~/game-state";
import { getScoreGrade } from "~/scoring.server";

export const loader = async () => {
  const player = await getPlayer("player-local");
  if (!player) {
    return json({ works: [], levels: [], player: null });
  }

  const works = await getPlayerWorks(player.id);
  const levels = await getAllLevels();
  const levelMap = new Map(levels.map((l) => [l.id, l]));

  const worksWithDetails = works.map((work) => ({
    ...work,
    levelTitle: levelMap.get(work.level_id)?.title || "未知",
    grade: getScoreGrade(work.score)
  }));

  return json({ works: worksWithDetails, levels, player });
};

type WorkWithDetails = Work & { levelTitle: string; grade: string };

export default function Works() {
  const { works, player } = useLoaderData<typeof loader>();
  const workList = works as WorkWithDetails[];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #1a1a1a 0%, #2a2520 100%)",
      padding: "2rem"
    }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem"
        }}>
          <div>
            <Link
              to="/"
              style={{
                color: "var(--sepia-dark)",
                textDecoration: "none",
                fontSize: "0.9rem"
              }}
            >
              ← 返回首页
            </Link>
            <h1 style={{
              color: "var(--sepia)",
              fontSize: "2rem",
              marginTop: "0.5rem"
            }}>
              作品库
            </h1>
          </div>
          {player && (
            <div style={{
              color: "var(--sepia-dark)",
              fontSize: "0.9rem",
              textAlign: "right"
            }}>
              <div>玩家: <strong style={{ color: "var(--accent)" }}>{player.name}</strong></div>
              <div>共 <strong>{workList.length}</strong> 件作品</div>
            </div>
          )}
        </div>

        {workList.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "4rem 2rem",
            border: "2px dashed var(--film-border)"
          }}>
            <p style={{
              color: "var(--sepia-dark)",
              fontSize: "1.1rem",
              marginBottom: "1rem"
            }}>
              还没有作品
            </p>
            <p style={{
              color: "var(--film-border)",
              fontSize: "0.9rem",
              marginBottom: "2rem"
            }}>
              完成关卡后，你的作品会自动保存到这里
            </p>
            <Link
              to="/levels"
              style={{
                display: "inline-block",
                padding: "0.7rem 2rem",
                background: "var(--accent)",
                color: "#1a1a1a",
                textDecoration: "none",
                fontWeight: "bold"
              }}
            >
              开始创作
            </Link>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem"
          }}>
            {workList.map((work) => {
              const font = FONT_STYLES.find((f) => f.id === work.font_style);
              return (
                <Link
                  key={work.id}
                  to={`/works/${work.id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block"
                  }}
                >
                  <div
                    style={{
                      background: "var(--film-bg)",
                      border: "1px solid var(--film-border)",
                      overflow: "hidden",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--film-border)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{
                      height: "140px",
                      background: "#0a0a0a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "1rem",
                      textAlign: "center",
                      overflow: "hidden"
                    }}>
                      <div
                        style={{
                          fontFamily: font?.fontFamily,
                          fontSize: `${Math.min(work.font_size, 28)}px`,
                          color: "var(--sepia)",
                          fontWeight: work.font_style.includes("bold")
                            ? "bold"
                            : "normal",
                          fontStyle: work.font_style.includes("italic")
                            ? "italic"
                            : "normal",
                          whiteSpace: "pre-line",
                          lineHeight: 1.3,
                          maxHeight: "100%",
                          overflow: "hidden"
                        }}
                      >
                        {work.subtitle_text}
                      </div>
                    </div>

                    <div style={{ padding: "1rem" }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem"
                      }}>
                        <span style={{
                          color: "var(--sepia)",
                          fontSize: "0.95rem",
                          fontWeight: "bold"
                        }}>
                          {work.levelTitle}
                        </span>
                        <span style={{
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                          color: "var(--accent)"
                        }}>
                          {work.grade}
                        </span>
                      </div>

                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span style={{
                          fontSize: "0.8rem",
                          color: "var(--sepia-dark)"
                        }}>
                          {work.score} 分
                        </span>
                        <span style={{
                          fontSize: "0.75rem",
                          color: "var(--film-border)"
                        }}>
                          {new Date(work.created_at).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
