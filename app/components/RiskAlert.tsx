import { AlertTriangle, AlertCircle, AlertOctagon, CheckCircle } from "lucide-react";

interface RiskAlertProps {
  level: "正常" | "关注" | "警告" | "危险";
  message?: string;
}

export function RiskAlert({ level, message }: RiskAlertProps) {
  if (level === "正常") return null;

  const config = {
    关注: {
      icon: CheckCircle,
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-800",
      iconColor: "text-blue-500",
    },
    警告: {
      icon: AlertCircle,
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-800",
      iconColor: "text-amber-500",
    },
    危险: {
      icon: AlertOctagon,
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      iconColor: "text-red-500",
    },
  };

  const { icon: Icon, bg, text, iconColor } = config[level as keyof typeof config] || config.关注;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${bg} ${text} animate-pulse-alert`}>
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <div className="font-medium">
          {level === "危险" ? "紧急风险提示" : level === "警告" ? "风险预警" : "注意"}
        </div>
        {message && <div className="text-sm mt-1 opacity-80">{message}</div>}
      </div>
    </div>
  );
}
