import { Link } from "@remix-run/react";
import { Building2, Users, AlertTriangle, Clock } from "lucide-react";

interface KanbanCard {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  riskLevel?: string;
  count?: number;
}

interface KanbanColumnProps {
  title: string;
  icon: typeof Building2;
  items: KanbanCard[];
  color: string;
  linkBase: string;
}

function KanbanColumn({ title, icon: Icon, items, color, linkBase }: KanbanColumnProps) {
  return (
    <div className="bg-slate-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className="ml-auto bg-white px-2 py-0.5 rounded-full text-sm font-medium text-slate-600">
          {items.length}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`${linkBase}/${item.id}`}
            className="block bg-white rounded-lg p-3 border border-slate-200 card-hover"
          >
            <div className="font-medium text-slate-900 text-sm">{item.title}</div>
            <div className="text-xs text-slate-500 mt-1">{item.subtitle}</div>
            {item.status && (
              <div className="mt-2">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  item.status === "已归档" ? "bg-emerald-100 text-emerald-700" :
                  item.status === "执行中" ? "bg-blue-100 text-blue-700" :
                  item.status === "待复查" ? "bg-amber-100 text-amber-700" :
                  item.status === "已退回" || item.status === "退回修改" ? "bg-red-100 text-red-700" :
                  "bg-slate-100 text-slate-700"
                }`}>
                  {item.status}
                </span>
                {item.riskLevel && item.riskLevel !== "正常" && (
                  <span className={`inline-block ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                    item.riskLevel === "危险" ? "bg-red-100 text-red-700 animate-pulse-alert" :
                    item.riskLevel === "警告" ? "bg-amber-100 text-amber-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {item.riskLevel}
                  </span>
                )}
              </div>
            )}
          </Link>
        ))}

        {items.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-sm">
            暂无数据
          </div>
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  title: string;
  groups: {
    id: string;
    title: string;
    items: KanbanCard[];
    color: string;
    linkBase: string;
  }[];
}

export function KanbanBoard({ title, groups }: KanbanBoardProps) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
      <div className={`grid gap-4 ${groups.length === 2 ? "grid-cols-2" : groups.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
        {groups.map((group) => {
          const Icon = {
            "Building2": Building2,
            "Users": Users,
            "AlertTriangle": AlertTriangle,
            "Clock": Clock,
          }[group.title] || Building2;

          return (
            <KanbanColumn
              key={group.id}
              title={group.title}
              icon={Icon}
              items={group.items}
              color={group.color}
              linkBase={group.linkBase}
            />
          );
        })}
      </div>
    </div>
  );
}
