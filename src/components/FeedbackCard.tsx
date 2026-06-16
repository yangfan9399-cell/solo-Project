import type { CustomerFeedback } from "@/types/game";

interface FeedbackCardProps {
  feedback: CustomerFeedback;
  visible: boolean;
}

const getEmoji = (score: number) => {
  if (score >= 80) return "😊";
  if (score >= 60) return "🙂";
  if (score >= 40) return "😐";
  return "😞";
};

const FeedbackCard = ({ feedback, visible }: FeedbackCardProps) => {
  if (!visible || !feedback) return null;

  const emoji = getEmoji(feedback.satisfaction);

  return (
    <div
      style={{
        backgroundColor: "#1a1a2e",
        borderRadius: 12,
        padding: 24,
        color: "#e0e0e0",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600 }}>满意度</span>
          <span style={{ fontSize: 24 }}>{emoji}</span>
        </div>
        <div
          style={{
            width: "100%",
            height: 12,
            backgroundColor: "#2a2a4a",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${feedback.satisfaction}%`,
              height: "100%",
              backgroundColor:
                feedback.satisfaction >= 80
                  ? "#4caf50"
                  : feedback.satisfaction >= 60
                    ? "#ff9800"
                    : feedback.satisfaction >= 40
                      ? "#ffc107"
                      : "#f44336",
              borderRadius: 6,
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <div
          style={{
            textAlign: "right",
            fontSize: 14,
            marginTop: 4,
            color: "#aaa",
          }}
        >
          {feedback.satisfaction}%
        </div>
      </div>

      <div
        style={{
          marginBottom: 20,
          borderLeft: "3px solid #4a4a6a",
          paddingLeft: 16,
        }}
      >
        <p style={{ fontStyle: "italic", margin: 0, lineHeight: 1.6 }}>
          "{feedback.comment}"
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
            color: "#4caf50",
          }}
        >
          赞誉
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {feedback.praiseAspects.length > 0 ? (
            feedback.praiseAspects.map((aspect) => (
              <span
                key={aspect}
                style={{
                  backgroundColor: "rgba(76, 175, 80, 0.15)",
                  color: "#4caf50",
                  padding: "4px 12px",
                  borderRadius: 16,
                  fontSize: 13,
                  border: "1px solid rgba(76, 175, 80, 0.3)",
                }}
              >
                {aspect}
              </span>
            ))
          ) : (
            <span style={{ color: "#666", fontSize: 13 }}>暂无</span>
          )}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
            color: "#f44336",
          }}
        >
          批评
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {feedback.criticismAspects.length > 0 ? (
            feedback.criticismAspects.map((aspect) => (
              <span
                key={aspect}
                style={{
                  backgroundColor: "rgba(244, 67, 54, 0.15)",
                  color: "#f44336",
                  padding: "4px 12px",
                  borderRadius: 16,
                  fontSize: 13,
                  border: "1px solid rgba(244, 67, 54, 0.3)",
                }}
              >
                {aspect}
              </span>
            ))
          ) : (
            <span style={{ color: "#666", fontSize: 13 }}>暂无</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackCard;
