import { component$, useStore, $ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { Layout } from '~/components/layout/layout';
import { Empty } from '~/components/ui/empty';
import { Modal } from '~/components/ui/modal';
import { StatusBadge } from '~/components/ui/status-badge';
import { REVIEW_TYPE_LABELS, REVIEW_STATUS_LABELS } from '~/constants';
import { fetchApi, serverFetch } from '~/utils/api';
import type { Review, Book, User } from '~/types';
import clsx from 'clsx';

export const useReviewsData = routeLoader$(async () => {
  try {
    const [reviews, books, users] = await Promise.all([
      serverFetch<Review[]>('/reviews'),
      serverFetch<Book[]>('/books'),
      serverFetch<User[]>('/users'),
    ]);
    return { reviews, books, users };
  } catch (e) {
    return { reviews: [], books: [], users: [] };
  }
});

export default component$(() => {
  const data = useReviewsData();
  const state = useStore({
    filterType: '',
    filterStatus: '',
    isReviewModalOpen: false,
    selectedReview: null as Review | null,
    reviewComment: '',
    reviewResult: 'approved' as 'approved' | 'rejected' | 'need_revision',
  });

  const getBookTitle = (bookId: string) => {
    return data.value.books.find(b => b.id === bookId)?.title || '未知古籍';
  };

  const getUserName = (userId: string) => {
    return data.value.users.find(u => u.id === userId)?.name || '未知用户';
  };

  const filteredReviews = data.value.reviews.filter(r => {
    const matchType = !state.filterType || r.type === state.filterType;
    const matchStatus = !state.filterStatus || r.status === state.filterStatus;
    return matchType && matchStatus;
  });

  const pendingReviews = filteredReviews.filter(r => r.status === 'pending');
  const reviewedReviews = filteredReviews.filter(r => r.status !== 'pending');

  const handleOpenReview = $((review: Review) => {
    state.selectedReview = review;
    state.reviewComment = review.comments || '';
    state.reviewResult = 'approved';
    state.isReviewModalOpen = true;
  });

  const handleSubmitReview = $(async () => {
    if (!state.selectedReview) return;
    
    try {
      await fetchApi(`/reviews/${state.selectedReview.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: state.reviewResult,
          comments: state.reviewComment,
        }),
      });
      state.isReviewModalOpen = false;
      window.location.reload();
    } catch (e) {
      console.error('Failed to submit review');
    }
  });

  return (
    <Layout>
      <div class="p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">专家复核</h1>
          <p class="text-gray-500 mt-1">复核病害诊断与修复方案</p>
        </div>

        {/* Stats */}
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="card text-center">
            <p class="text-3xl font-bold">{data.value.reviews.length}</p>
            <p class="text-sm text-gray-500 mt-1">全部复核</p>
          </div>
          <div class="card text-center border-l-4 border-l-yellow-500">
            <p class="text-3xl font-bold text-yellow-600">
              {data.value.reviews.filter(r => r.status === 'pending').length}
            </p>
            <p class="text-sm text-gray-500 mt-1">待复核</p>
          </div>
          <div class="card text-center border-l-4 border-l-green-500">
            <p class="text-3xl font-bold text-green-600">
              {data.value.reviews.filter(r => r.status === 'approved').length}
            </p>
            <p class="text-sm text-gray-500 mt-1">已通过</p>
          </div>
          <div class="card text-center border-l-4 border-l-red-500">
            <p class="text-3xl font-bold text-red-600">
              {data.value.reviews.filter(r => r.status === 'rejected' || r.status === 'need_revision').length}
            </p>
            <p class="text-sm text-gray-500 mt-1">需处理</p>
          </div>
        </div>

        {/* Filters */}
        <div class="card mb-6">
          <div class="flex flex-wrap gap-4 items-end">
            <div class="flex-1 min-w-[200px]">
              <label class="label">复核类型</label>
              <select
                class="input"
                value={state.filterType}
                onChange$={(_, el) => state.filterType = el.value}
              >
                <option value="">全部类型</option>
                <option value="disease_diagnosis">病害诊断复核</option>
                <option value="repair_process">修复过程复核</option>
                <option value="final_archive">最终归档复核</option>
              </select>
            </div>
            <div class="flex-1 min-w-[200px]">
              <label class="label">复核状态</label>
              <select
                class="input"
                value={state.filterStatus}
                onChange$={(_, el) => state.filterStatus = el.value}
              >
                <option value="">全部状态</option>
                <option value="pending">待复核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
                <option value="need_revision">需修改</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pending Reviews */}
        <div class="card mb-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
            待复核 ({pendingReviews.length})
          </h2>
          {pendingReviews.length === 0 ? (
            <Empty title="暂无待复核项" icon="✅" description="所有复核已完成" />
          ) : (
            <div class="space-y-4">
              {pendingReviews.map(review => (
                <div key={review.id} class="p-4 border rounded-lg hover:border-antique-400 transition-colors">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <h3 class="font-semibold">{getBookTitle(review.book_id)}</h3>
                        <span class="badge bg-blue-100 text-blue-800">
                          {REVIEW_TYPE_LABELS[review.type]}
                        </span>
                        <StatusBadge status={review.status} type="review" />
                      </div>
                      <p class="text-sm text-gray-500">
                        提交人：{getUserName(review.reviewer_id)} · 
                        提交时间：{new Date(review.submitted_at).toLocaleString('zh-CN')}
                      </p>
                      {review.comments && (
                        <p class="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded">
                          💬 {review.comments}
                        </p>
                      )}
                    </div>
                    <button 
                      class="btn btn-primary"
                      onClick$={() => handleOpenReview(review)}
                    >
                      开始复核
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviewed */}
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">已复核记录</h2>
          {reviewedReviews.length === 0 ? (
            <Empty title="暂无复核记录" />
          ) : (
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-3 px-4 font-medium text-gray-600">古籍</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">复核类型</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">复核意见</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">复核时间</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewedReviews.map(review => (
                    <tr key={review.id} class="border-b hover:bg-gray-50">
                      <td class="py-3 px-4 font-medium">{getBookTitle(review.book_id)}</td>
                      <td class="py-3 px-4">{REVIEW_TYPE_LABELS[review.type]}</td>
                      <td class="py-3 px-4">
                        <StatusBadge status={review.status} type="review" />
                      </td>
                      <td class="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {review.comments || '-'}
                      </td>
                      <td class="py-3 px-4 text-gray-500 text-sm">
                        {review.reviewed_at ? new Date(review.reviewed_at).toLocaleDateString('zh-CN') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review Modal */}
        <Modal
          isOpen={state.isReviewModalOpen}
          onClose$={() => state.isReviewModalOpen = false}
          title="专家复核"
          size="lg"
        >
          {state.selectedReview && (
            <div>
              <div class="mb-4 p-4 bg-gray-50 rounded-lg">
                <p class="font-medium mb-1">{getBookTitle(state.selectedReview.book_id)}</p>
                <p class="text-sm text-gray-500">
                  {REVIEW_TYPE_LABELS[state.selectedReview.type]}
                </p>
              </div>
              
              <div class="mb-4">
                <label class="label">复核结果</label>
                <div class="grid grid-cols-3 gap-3">
                  {(['approved', 'rejected', 'need_revision'] as const).map(result => (
                    <button
                      key={result}
                      class={clsx(
                        'p-3 rounded-lg border-2 text-center transition-colors',
                        state.reviewResult === result 
                          ? 'border-antique-500 bg-antique-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick$={() => state.reviewResult = result}
                    >
                      {REVIEW_STATUS_LABELS[result]}
                    </button>
                  ))}
                </div>
              </div>

              <div class="mb-6">
                <label class="label">复核意见</label>
                <textarea
                  class="input min-h-[120px]"
                  placeholder="请输入复核意见..."
                  value={state.reviewComment}
                  onInput$={(_, el) => state.reviewComment = el.value}
                />
              </div>

              <div class="flex justify-end gap-3">
                <button 
                  class="btn btn-secondary"
                  onClick$={() => state.isReviewModalOpen = false}
                >
                  取消
                </button>
                <button 
                  class="btn btn-primary"
                  onClick$={handleSubmitReview}
                >
                  提交复核
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
});
