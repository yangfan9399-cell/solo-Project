import { useState, useEffect } from 'react';
import { apiRequest, formatDate, formatMoney } from '../utils/api';
import Loading from './Loading';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import Modal from './Modal';
import Pagination from './Pagination';

export default function BookList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [formData, setFormData] = useState({
    isbn: '', title: '', author: '', publisher: '', publish_date: '',
    category: '', description: '', price: '', preorder_price: '', deposit_amount: '', status: 'active'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiRequest(`/books?page=${page}&pageSize=10${keyword ? '&keyword=' + keyword : ''}${categoryFilter ? '&category=' + categoryFilter : ''}`);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, keyword, categoryFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedBook?.id) {
        await apiRequest(`/books/${selectedBook.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiRequest('/books', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setEditModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (book) => {
    setSelectedBook(book);
    setFormData({
      isbn: book.isbn || '',
      title: book.title || '',
      author: book.author || '',
      publisher: book.publisher || '',
      publish_date: book.publish_date || '',
      category: book.category || '',
      description: book.description || '',
      price: book.price || '',
      preorder_price: book.preorder_price || '',
      deposit_amount: book.deposit_amount || '',
      status: book.status || 'active'
    });
    setEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这本图书吗？')) return;
    try {
      await apiRequest(`/books/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">图书管理</h1>
        <button
          onClick={() => {
            setSelectedBook(null);
            setFormData({
              isbn: '', title: '', author: '', publisher: '', publish_date: '',
              category: '', description: '', price: '', preorder_price: '', deposit_amount: '', status: 'active'
            });
            setEditModal(true);
          }}
          className="btn btn-primary"
        >
          + 添加图书
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b flex items-center space-x-4">
          <input
            type="text"
            placeholder="搜索书名、作者或ISBN..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            className="input w-64"
          />
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="input w-40"
          >
            <option value="">全部分类</option>
            {data.categories?.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {data.data.length === 0 ? (
          <EmptyState icon="📚" title="暂无图书" description="点击右上角按钮添加新图书" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">图书</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ISBN</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">分类</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">定价</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">预售订金</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">库存</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.data.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-12 h-16 bg-gray-100 rounded flex items-center justify-center text-2xl mr-3">
                            📖
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{book.title}</div>
                            <div className="text-xs text-gray-500">{book.author}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{book.isbn || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{book.category || '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatMoney(book.price)}</td>
                      <td className="px-4 py-3 text-sm text-primary-600">{formatMoney(book.deposit_amount)}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <span className="text-green-600">可售: {book.quantity_available || 0}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-orange-600">预留: {book.quantity_reserved || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={async () => {
                              const detail = await apiRequest(`/books/${book.id}`);
                              setSelectedBook(detail);
                              setDetailModal(true);
                            }}
                            className="text-primary-600 hover:text-primary-800 text-sm"
                          >
                            详情
                          </button>
                          <button
                            onClick={() => handleEdit(book)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(book.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={10}
              total={data.pagination.total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title={selectedBook?.id ? '编辑图书' : '添加图书'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">书名 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">ISBN</label>
              <input
                type="text"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">作者</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">出版社</label>
              <input
                type="text"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">出版日期</label>
              <input
                type="date"
                value={formData.publish_date}
                onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">分类</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
                placeholder="如：外国文学、中国文学"
              />
            </div>
            <div>
              <label className="label">定价 *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">预售订金</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.deposit_amount}
                onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">简介</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="3"
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setEditModal(false)} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="图书详情" size="lg">
        {selectedBook && (
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="w-24 h-32 bg-gray-100 rounded flex items-center justify-center text-4xl mr-6">
                📖
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedBook.title}</h3>
                <div className="text-gray-600">
                  <p>作者：{selectedBook.author || '-'}</p>
                  <p>出版社：{selectedBook.publisher || '-'}</p>
                  <p>ISBN：{selectedBook.isbn || '-'}</p>
                  <p>分类：{selectedBook.category || '-'}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">{formatMoney(selectedBook.price)}</div>
                <div className="text-sm text-gray-500">订金：{formatMoney(selectedBook.deposit_amount)}</div>
              </div>
            </div>
            {selectedBook.description && (
              <div>
                <h4 className="font-medium mb-2">内容简介</h4>
                <p className="text-gray-600">{selectedBook.description}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{selectedBook.quantity_available || 0}</div>
                <div className="text-sm text-gray-500">可售库存</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{selectedBook.quantity_reserved || 0}</div>
                <div className="text-sm text-gray-500">已预留</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{selectedBook.preorders?.length || 0}</div>
                <div className="text-sm text-gray-500">预售中</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
