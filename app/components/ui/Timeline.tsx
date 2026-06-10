import type { ReactNode } from "react";

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: ReactNode;
  status?: "completed" | "pending" | "active";
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={item.id} className="relative flex items-start">
            <div
              className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                item.status === "completed"
                  ? "bg-success-500 text-white"
                  : item.status === "active"
                  ? "bg-primary-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {item.status === "completed" ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : item.status === "active" ? (
                <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <span className="text-sm font-bold">{index + 1}</span>
              )}
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                <span className="text-xs text-gray-500">{item.timestamp}</span>
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-gray-600">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
