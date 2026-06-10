interface DataTableProps {
  data: Array<Record<string, unknown>>
  columns: Array<{ key: string; label: string }>
  onRowClick?: (row: Record<string, unknown>) => void
  rowClassName?: (row: Record<string, unknown>) => string
}

export default function DataTable({
  data,
  columns,
  onRowClick,
  rowClassName,
}: DataTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr
              key={index}
              onClick={() => onRowClick?.(row)}
              className={`${
                onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
              } ${rowClassName?.(row) || ''}`}
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {String(row[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="px-6 py-12 text-center text-gray-500">暂无数据</div>
      )}
    </div>
  )
}