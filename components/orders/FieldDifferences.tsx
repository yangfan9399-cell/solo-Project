"use client";

import { FieldDifference } from "@prisma/client";
import { DifferenceTypeBadge } from "@/components/ui/DifferenceTypeBadge";
import { formatDate } from "@/lib/utils";

interface FieldDifferencesProps {
  differences: FieldDifference[];
}

export function FieldDifferences({ differences }: FieldDifferencesProps) {
  if (differences.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        暂无字段变更记录
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              变更类型
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              字段
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              原值
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              新值
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              变更人
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              变更时间
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {differences.map((diff) => (
            <tr key={diff.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <DifferenceTypeBadge type={diff.differenceType} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {diff.fieldLabel}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 line-through">
                {diff.oldValue || "-"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">
                {diff.newValue || "-"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {diff.changedBy}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {formatDate(diff.changedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
