import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getAllLevels, getLevelBestScore, getPlayer } from "~/db.server";
import { getScoreGrade } from "~/scoring.server";

export const loader = async () => {
  const levels = await getAllLevels();
  const player = await getPlayer("player-local");

  const levelsWithScores = await Promise.all(levels.map(async (level) => {
    const bestScore = player ? await getLevelBestScore(player.id, level.id) : null;
    return {
      ...level,
      bestScore,
      grade: bestScore ? getScoreGrade(bestScore) : null
    };
  }));

  return json({ levels: levelsWithScores, player });
};

export default function Levels() {
  const { levels, player } = useLoaderData<typeof loader>();

  return (
    <div style={{
      minHeight: "100vh",
      padding: "2rem",
      background: "linear-gradient(180deg, #1a1a1a 0%, #2a2520 100%)"
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
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
              选择场景
            </h1>
          </div>
          {player && (
            <div style={{
              color: "var(--sepia-dark)",
              fontSize: "0.9rem"
            }}>
              总分: <strong style={{ color: "var(--accent)" }}>{player.total_score}</strong>
            </div>
          )}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1.5rem"
        }}>
          {levels.map((level, index) => (
            <Link
              key={level.id}
              to={`/play/${level.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block"
              }}
            >
              <div
                style={{
                  background: "var(--film-bg)",
                  border: "2px solid var(--film-border)",
                  padding: "1.5rem",
                  height: "100%",
                  transition: "all 0.3s",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(212, 165, 116, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--film-border)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  position: "absolute",
                  top: "0.5rem",
                  right: "0.75rem",
                  fontSize: "0.75rem",
                  color: "var(--sepia-dark)"
                }}>
                  第 {index + 1} 幕
                </div>

                <h3 style={{
                  color: "var(--sepia)",
                  fontSize: "1.3rem",
                  marginBottom: "0.5rem",
                  paddingRight: "3rem"
                }}>
                  {level.title}
                </h3>

                <div style={{
                  display: "flex",
                  gap: "0.25rem",
                  marginBottom: "1rem"
                }}>
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "0.8rem",
                        color: i < level.difficulty ? "var(--accent)" : "var(--film-border)"
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <p style={{
                  color: "var(--sepia-dark)",
                  fontSize: "0.85rem",
                  lineHeight: "1.6",
                  marginBottom: "1rem"
                }}>
                  {level.description}
                </p>

                <div style={{
                  borderTop: "1px solid var(--film-border)",
                  paddingTop: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{
                    fontSize: "0.8rem",
                    color: "var(--sepia-dark)"
                  }}>
                    时长: {(level.duration / 1000).toFixed(1)}s
                  </span>
                  {level.bestScore !== null ? (
                    <span style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "var(--accent)"
                    }}>
                      {level.grade} · {level.bestScore}
                    </span>
                  ) : (
                    <span style={{
                      fontSize: "0.8rem",
                      color: "var(--film-border)",
                      fontStyle: "italic"
                    }}>
                      未通关
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
