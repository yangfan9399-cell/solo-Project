import { Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getPlayer, getPlayerWorks } from "~/db.server";

export const loader = async () => {
  const player = await getPlayer("player-local");
  const works = player ? await getPlayerWorks(player.id) : [];
  return json({ player, worksCount: works.length });
};

export default function Index() {
  const { player, worksCount } = useLoaderData<typeof loader>();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg, #1a1a1a 0%, #2a2520 50%, #1a1a1a 100%)",
      padding: "2rem"
    }}>
      <div style={{
        border: "4px double var(--sepia-dark)",
        padding: "3rem 4rem",
        textAlign: "center",
        maxWidth: "600px",
        background: "rgba(42, 37, 32, 0.8)",
        boxShadow: "0 0 60px rgba(212, 165, 116, 0.2)"
      }}>
        <h1 style={{
          fontSize: "3rem",
          color: "var(--sepia)",
          marginBottom: "0.5rem",
          letterSpacing: "0.1em",
          textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
        }}>
          无声电影
        </h1>
        <h2 style={{
          fontSize: "1.5rem",
          color: "var(--sepia-dark)",
          marginBottom: "2rem",
          fontStyle: "italic",
          fontWeight: "normal"
        }}>
          字幕卡制作游戏
        </h2>

        <div style={{
          width: "100%",
          height: "2px",
          background: "linear-gradient(90deg, transparent, var(--sepia-dark), transparent)",
          margin: "1.5rem 0"
        }} />

        <p style={{
          color: "var(--sepia-dark)",
          lineHeight: "1.8",
          marginBottom: "2rem",
          fontSize: "1rem"
        }}>
          回到默片时代，为经典场景配上台词字幕。
          <br />
          把握镜头节奏，选择合适字体，
          <br />
          让你的字幕卡成为点睛之笔。
        </p>

        {player && (
          <div style={{
            background: "rgba(139, 115, 85, 0.2)",
            padding: "1rem 1.5rem",
            marginBottom: "2rem",
            border: "1px solid var(--film-border)"
          }}>
            <p style={{ color: "var(--sepia)", fontSize: "0.9rem" }}>
              <strong style={{ color: "var(--accent)" }}>{player.name}</strong>
              {" · "}
              总分: <strong>{player.total_score}</strong>
              {" · "}
              通关: <strong>{player.levels_completed}</strong>
              {" · "}
              作品: <strong>{worksCount}</strong>
            </p>
          </div>
        )}

        <div style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          <Link
            to="/levels"
            style={{
              display: "inline-block",
              padding: "0.8rem 2rem",
              background: "var(--accent)",
              color: "#1a1a1a",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.1rem",
              letterSpacing: "0.05em",
              border: "2px solid var(--accent-dark)",
              transition: "all 0.2s"
            }}
          >
            开始游戏
          </Link>
          <Link
            to="/works"
            style={{
              display: "inline-block",
              padding: "0.8rem 2rem",
              background: "transparent",
              color: "var(--sepia)",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.1rem",
              letterSpacing: "0.05em",
              border: "2px solid var(--sepia-dark)",
              transition: "all 0.2s"
            }}
          >
            作品库
          </Link>
        </div>
      </div>

      <p style={{
        marginTop: "2rem",
        color: "var(--sepia-dark)",
        fontSize: "0.8rem",
        opacity: 0.6
      }}>
        — 用文字讲述无声的故事 —
      </p>
    </div>
  );
}
