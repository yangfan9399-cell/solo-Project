export default function Pagination({ page, current, pageSize, total, onPageChange, onChange }) {
  const activePage = page || current || 1;
  const handlePageChange = onPageChange || onChange;
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, activePage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <div className="text-sm text-gray-500">
        共 {total} 条，第 {activePage} / {totalPages} 页
      </div>
      <div className="flex space-x-1">
        <button
          onClick={() => handlePageChange(1)}
          disabled={activePage === 1}
          className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          首页
        </button>
        <button
          onClick={() => handlePageChange(activePage - 1)}
          disabled={activePage === 1}
          className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          上一页
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => handlePageChange(p)}
            className={`px-3 py-1 rounded border text-sm ${
              p === activePage
                ? 'bg-primary-600 text-white border-primary-600'
                : 'hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(activePage + 1)}
          disabled={activePage === totalPages}
          className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          下一页
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={activePage === totalPages}
          className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          末页
        </button>
      </div>
    </div>
  );
}
