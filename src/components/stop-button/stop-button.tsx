import { component$, useSignal, useTask$, $ } from "@builder.io/qwik";
import type { PipeStop } from "~/lib/types";

interface StopButtonProps {
  stop: PipeStop;
  active: boolean;
  disabled?: boolean;
  onToggle$: (stopId: string) => void;
  showLabel?: boolean;
}

const typeColors: Record<string, string> = {
  principal: "var(--pipe-gold)",
  flute: "var(--pipe-silver)",
  string: "#9b59b6",
  reed: "#e74c3c",
  mixture: "#2ecc71",
};

export const StopButton = component$<StopButtonProps>(
  ({ stop, active, disabled, onToggle$, showLabel = true }) => {
    const color = typeColors[stop.type] || "var(--pipe-gold)";

    const handleClick = $(() => {
      if (!disabled) {
        onToggle$(stop.id);
      }
    });

    return (
      <div class="stop-wrapper">
        <button
          class={`stop-button ${active ? "active" : ""} ${disabled ? "disabled" : ""}`}
          onClick$={handleClick}
          aria-pressed={active}
          aria-label={`${stop.name} ${active ? "已启用" : "未启用"}`}
        >
          <div class="stop-knob" style={{ background: active ? color : "#333", boxShadow: active ? `0 0 15px ${color}` : "none" }}>
            <div class="knob-inner" style={{ background: active ? `linear-gradient(145deg, ${color}, ${color}aa)` : "linear-gradient(145deg, #444, #222)" }}></div>
          </div>
          <div class="stop-stem" style={{ background: active ? "#555" : "#222" }}></div>
        </button>
        {showLabel && (
          <div class="stop-label">
            <span class="stop-name">{stop.name}</span>
            <span class="stop-type" style={{ color }}>{stop.type}</span>
          </div>
        )}
      </div>
    );
  }
);
