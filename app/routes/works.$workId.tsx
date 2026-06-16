import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getWork, getLevel, getActionHistory, getSession } from "~/db.server";
import { FONT_STYLES } from "~/game-state";
import { getScoreGrade, calculateScore } from "~/scoring.server";

export const loader = async ({ params }: { params: { workId: string } }) => {
  const work = await getWork(params.workId);
  if (!work) {
    throw new Response("Not Found", { status: 404 });
  }

  const level = await getLevel(work.level_id);
  const session = await getSession(work.session_id);
  const actionHistory = session ? await getActionHistory(session.id) : [];
  const grade = getScoreGrade(work.score);

  let scoreResult = null;
  if (level) {
    scoreResult = calculateScore(
      {
        subtitleText: work.subtitle_text,
        fontStyle: work.font_style,
        fontSize: work.font_size,
        timingStart: work.timing_start,
        timingEnd: work.timing_end
      },
      level
    );
  }

  return json({ work, level, session, grade, scoreResult, actionCount: actionHistory.length });
};

export default function WorkDetail() {
  const { work, level, grade, scoreResult, actionCount } =
    useLoaderData<typeof loader>();

  const font = FONT_STYLES.find((f) => f.id === work.font_style);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #1a1a1a 0%, #2a2520 100%)",
      padding: "2rem"
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Link
          to="/works"
          style={{
            color: "var(--sepia-dark)",
            textDecoration: "none",
            fontSize: "0.9rem"
          }}
        >
          ← 返回作品库
        </Link>

        <h1 style={{
          color: "var(--sepia)",
          fontSize: "1.8rem",
          marginTop: "1rem",
          marginBottom: "1.5rem"
        }}>
          {level?.title || "作品详情"}
        </h1>

        <div style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          background: `
            radial-gradient(ellipse at center, #3a3028 0%, #1a1510 70%),
            linear-gradient(180deg, #2a2520 0%, #1a1510 100%)
          `,
          border: "3px solid var(--film-border)",
          marginBottom: "1.5rem",
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
            {level?.scene_description}
          </div>

          <div style={{
            position: "absolute",
            bottom: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "80%",
            textAlign: "center"
          }}>
            <div
              style={{
                display: "inline-block",
                background: "rgba(0, 0, 0, 0.85)",
                padding: "1rem 2rem",
                border: "2px solid var(--sepia)",
                fontFamily: font?.fontFamily,
                fontSize: `${work.font_size}px`,
                color: "var(--sepia)",
                lineHeight: "1.4",
                whiteSpace: "pre-line",
                fontWeight: work.font_style.includes("bold")
                  ? "bold"
                  : "normal",
                fontStyle: work.font_style.includes("italic")
                  ? "italic"
                  : "normal",
                textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                letterSpacing: "0.02em"
              }}
            >
              {work.subtitle_text}
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
            显示: {(work.timing_start / 1000).toFixed(2)}s -{" "}
            {(work.timing_end / 1000).toFixed(2)}s
          </div>
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
            padding: "1.5rem",
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "3rem",
              fontWeight: "bold",
              color: "var(--accent)",
              lineHeight: 1,
              marginBottom: "0.25rem"
            }}>
              {grade}
            </div>
            <div style={{
              fontSize: "1.2rem",
              color: "var(--sepia)"
            }}>
              <strong>{work.score}</strong> 分
            </div>
          </div>

          <div style={{
            background: "var(--film-bg)",
            border: "1px solid var(--film-border)",
            padding: "1.5rem"
          }}>
            <div style={{ color: "var(--sepia-dark)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              作品信息
            </div>
            <div style={{ display: "grid", gap: "0.35rem", fontSize: "0.9rem" }}>
              <div>
                <span style={{ color: "var(--sepia-dark)" }}>关卡: </span>
                <span style={{ color: "var(--sepia)" }}>{level?.title}</span>
              </div>
              <div>
                <span style={{ color: "var(--sepia-dark)" }}>字体: </span>
                <span style={{ color: "var(--sepia)" }}>{font?.name}</span>
              </div>
              <div>
                <span style={{ color: "var(--sepia-dark)" }}>字号: </span>
                <span style={{ color: "var(--sepia)" }}>{work.font_size}px</span>
              </div>
              <div>
                <span style={{ color: "var(--sepia-dark)" }}>操作次数: </span>
                <span style={{ color: "var(--sepia)" }}>{actionCount}</span>
              </div>
              <div>
                <span style={{ color: "var(--sepia-dark)" }}>创建时间: </span>
                <span style={{ color: "var(--sepia)" }}>
                  {new Date(work.created_at).toLocaleString("zh-CN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {scoreResult && (
          <div style={{
            background: "var(--film-bg)",
            border: "1px solid var(--film-border)",
            padding: "1.5rem",
            marginBottom: "1.5rem"
          }}>
            <h3 style={{
              color: "var(--sepia)",
              fontSize: "1rem",
              marginBottom: "1rem",
              textAlign: "center"
            }}>
              评分明细
            </h3>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <ScoreItem
                label="文案准确度"
                score={scoreResult.textAccuracy}
                max={40}
                detail={`相似度 ${scoreResult.details.textSimilarity}%`}
              />
              <ScoreItem
                label="时机精准度"
                score={scoreResult.timingAccuracy}
                max={30}
                detail={`时间重合度 ${scoreResult.details.timingOverlap}%`}
              />
              <ScoreItem
                label="样式匹配度"
                score={scoreResult.styleMatch}
                max={30}
                detail={
                  scoreResult.details.fontStyleMatch
                    ? "字体风格吻合"
                    : "字体风格偏差"
                }
              />
              <ScoreItem
                label="整体可读性"
                score={scoreResult.readability}
                max={20}
                detail={`时长比例 ${(scoreResult.details.durationRatio * 100).toFixed(0)}%`}
              />
            </div>
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <Link
            to={`/play/${level?.id}`}
            style={{
              display: "inline-block",
              padding: "0.7rem 2rem",
              background: "var(--accent)",
              color: "#1a1a1a",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              border: "2px solid var(--accent-dark)"
            }}
          >
            再玩一次
          </Link>
        </div>
      </div>
    </div>
  );
}

function ScoreItem({
  label,
  score,
  max,
  detail
}: {
  label: string;
  score: number;
  max: number;
  detail: string;
}) {
  const percent = (score / max) * 100;
  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "0.25rem"
      }}>
        <span style={{ color: "var(--sepia)", fontSize: "0.9rem" }}>
          {label}
        </span>
        <span style={{ color: "var(--sepia-dark)", fontSize: "0.8rem" }}>
          {score} / {max}
        </span>
      </div>
      <div style={{
        height: "6px",
        background: "rgba(0,0,0,0.3)",
        borderRadius: "3px",
        overflow: "hidden"
      }}>
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: "var(--accent)",
            borderRadius: "3px"
          }}
        />
      </div>
      <div style={{
        fontSize: "0.7rem",
        color: "var(--sepia-dark)",
        marginTop: "0.2rem"
      }}>
        {detail}
      </div>
    </div>
  );
}
