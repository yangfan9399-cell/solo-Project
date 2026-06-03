import React from 'react';
import Loading from './Loading';
import EmptyState from './EmptyState';

interface Column<T> {
  key: keyof T | string;
  title: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  rowKey?: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T extends object>({
  columns,
  data,
  loading = false,
  emptyTitle = '暂无数据',
  emptyDescription,
  emptyAction,
  rowKey,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="py-16">
        <Loading text="加载中..." />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className={col.className}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr
              key={rowKey ? rowKey(item) : index}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className={col.className}>
                  {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key as string] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
