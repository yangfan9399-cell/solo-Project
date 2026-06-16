import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  getSession,
  getLevel,
  getActionHistory,
  getPlayer
} from "~/db.server";
import { getScoreGrade, isPassing, calculateScore } from "~/scoring.server";
import { FONT_STYLES } from "~/game-state";

export const loader = async ({ params }: { params: { sessionId: string } }) => {
  const session = await getSession(params.sessionId);
  if (!session) {
    throw new Response("Not Found", { status: 404 });
  }

  const level = await getLevel(session.level_id);
  if (!level) {
    throw new Response("Level not found", { status: 404 });
  }

  const player = await getPlayer(session.player_id);
  const actionHistory = await getActionHistory(session.id);

  let submission = null;
  const submitAction = actionHistory.find((a) => a.action_type === "submit");
  if (submitAction && submitAction.action_data) {
    const data = JSON.parse(submitAction.action_data);
    submission = data.submission;
  }

  let scoreResult = null;
  if (session.final_score !== null && submission) {
    scoreResult = calculateScore(submission, level);
  }

  const passed = session.final_score !== null
    ? isPassing(session.final_score, level.min_score)
    : false;

  const grade = session.final_score !== null
    ? getScoreGrade(session.final_score)
    : null;

  return json({
    session,
    level,
    player,
    submission,
    scoreResult,
    passed,
    grade,
    actionCount: actionHistory.length
  });
};

export default function Result() {
  const { session, level, player, submission, scoreResult, passed, grade, actionCount } =
    useLoaderData<typeof loader>();

  const currentFont = FONT_STYLES.find(
    (f) => f.id === submission?.fontStyle
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #1a1a1a 0%, #2a2520 100%)",
      padding: "2rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        maxWidth: "700px",
        width: "100%",
        border: "3px double var(--sepia-dark)",
        padding: "2.5rem",
        background: "rgba(42, 37, 32, 0.9)",
        textAlign: "center"
      }}>
        <div style={{
          fontSize: "0.9rem",
          color: "var(--sepia-dark)",
          marginBottom: "0.5rem",
          letterSpacing: "0.2em"
        }}>
          — 第 {level.id.replace("level-", "")} 幕 —
        </div>
        <h1 style={{
          color: "var(--sepia)",
          fontSize: "2rem",
          marginBottom: "2rem"
        }}>
          {level.title}
        </h1>

        {passed ? (
          <div style={{
            background: "rgba(212, 165, 116, 0.1)",
            border: "2px solid var(--accent)",
            padding: "1.5rem",
            marginBottom: "2rem"
          }}>
            <div style={{
              fontSize: "5rem",
              fontWeight: "bold",
              color: "var(--accent)",
              lineHeight: 1,
              marginBottom: "0.5rem",
              textShadow: "0 0 30px rgba(212, 165, 116, 0.5)"
            }}>
              {grade}
            </div>
            <div style={{
              fontSize: "1.5rem",
              color: "var(--sepia)",
              marginBottom: "0.5rem"
            }}>
              <strong>{session.final_score}</strong> 分
            </div>
            <div style={{
              fontSize: "1rem",
              color: "var(--accent)"
            }}>
              ✦ 通关成功 ✦
            </div>
          </div>
        ) : (
          <div style={{
            background: "rgba(139, 69, 69, 0.1)",
            border: "2px solid #8b4545",
            padding: "1.5rem",
            marginBottom: "2rem"
          }}>
            <div style={{
              fontSize: "5rem",
              fontWeight: "bold",
              color: "#c47070",
              lineHeight: 1,
              marginBottom: "0.5rem"
            }}>
              {grade || "—"}
            </div>
            <div style={{
              fontSize: "1.5rem",
              color: "var(--sepia)",
              marginBottom: "0.5rem"
            }}>
              <strong>{session.final_score ?? 0}</strong> 分
            </div>
            <div style={{
              fontSize: "1rem",
              color: "#c47070"
            }}>
              未能通过 · 及格线 {level.min_score} 分
            </div>
          </div>
        )}

        {scoreResult && (
          <div style={{
            textAlign: "left",
            marginBottom: "2rem",
            background: "rgba(0,0,0,0.2)",
            padding: "1.5rem",
            border: "1px solid var(--film-border)"
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

        {submission && (
          <div style={{
            marginBottom: "2rem",
            textAlign: "left"
          }}>
            <h3 style={{
              color: "var(--sepia)",
              fontSize: "1rem",
              marginBottom: "1rem",
              textAlign: "center"
            }}>
              你的作品
            </h3>
            <div style={{
              background: "#0a0a0a",
              border: "2px solid var(--film-border)",
              padding: "2rem",
              textAlign: "center",
              minHeight: "100px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <div
                style={{
                  fontFamily: currentFont?.fontFamily,
                  fontSize: `${submission.fontSize}px`,
                  color: "var(--sepia)",
                  fontWeight: submission.fontStyle.includes("bold")
                    ? "bold"
                    : "normal",
                  fontStyle: submission.fontStyle.includes("italic")
                    ? "italic"
                    : "normal",
                  whiteSpace: "pre-line",
                  lineHeight: 1.4
                }}
              >
                {submission.subtitleText || "(空)"}
              </div>
            </div>
            <div style={{
              marginTop: "0.75rem",
              fontSize: "0.8rem",
              color: "var(--sepia-dark)",
              textAlign: "center"
            }}>
              显示时机: {(submission.timingStart / 1000).toFixed(2)}s -{" "}
              {(submission.timingEnd / 1000).toFixed(2)}s
              {" · "}
              操作次数: {actionCount}
            </div>
          </div>
        )}

        {player && (
          <div style={{
            marginBottom: "2rem",
            padding: "1rem",
            background: "rgba(139, 115, 85, 0.15)",
            border: "1px solid var(--film-border)"
          }}>
            <span style={{ color: "var(--sepia-dark)", fontSize: "0.9rem" }}>
              玩家: <strong style={{ color: "var(--accent)" }}>{player.name}</strong>
              {" · "}
              累计总分: <strong>{player.total_score}</strong>
              {" · "}
              通关数: <strong>{player.levels_completed}</strong>
            </span>
          </div>
        )}

        <div style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          <Link
            to={`/play/${level.id}`}
            style={{
              display: "inline-block",
              padding: "0.7rem 1.8rem",
              background: "var(--accent)",
              color: "#1a1a1a",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              border: "2px solid var(--accent-dark)"
            }}
          >
            再试一次
          </Link>
          <Link
            to="/levels"
            style={{
              display: "inline-block",
              padding: "0.7rem 1.8rem",
              background: "transparent",
              color: "var(--sepia)",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              border: "2px solid var(--sepia-dark)"
            }}
          >
            选择关卡
          </Link>
          <Link
            to="/works"
            style={{
              display: "inline-block",
              padding: "0.7rem 1.8rem",
              background: "transparent",
              color: "var(--sepia-dark)",
              textDecoration: "none",
              fontSize: "1rem",
              border: "1px solid var(--film-border)"
            }}
          >
            作品库
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
            borderRadius: "3px",
            transition: "width 0.5s ease"
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
