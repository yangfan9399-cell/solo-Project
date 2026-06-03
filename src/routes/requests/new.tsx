import { A } from "@solidjs/router";
import { createAsync, useAction } from "@solidjs/router";
import { createSignal, For, Match, Switch } from "solid-js";
import { createILLRequestAction, getLibrariesAction, searchBooksAction } from "~/server/actions";

export default function NewRequest() {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedBook, setSelectedBook] = createSignal<number | null>(null);
  const [searching, setSearching] = createSignal(false);
  const [searchResults, setSearchResults] = createSignal<any[]>([]);

  const libraries = createAsync(() => getLibrariesAction());
  const submitAction = useAction(createILLRequestAction);

  const handleBookSearch = async () => {
    if (!searchQuery()) return;
    setSearching(true);
    try {
      const results = await searchBooksAction(searchQuery());
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">新建馆际互借申请</h1>
          <p class="text-gray-500">为读者提交馆际互借申请</p>
        </div>
        <A href="/requests" class="btn-secondary">
          取消
        </A>
      </div>

      <form action={submitAction} method="post" class="space-y-6">
        <div class="card">
          <div class="card-header">
            <h2 class="text-lg font-semibold text-gray-900">读者信息</h2>
          </div>
          <div class="card-body space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  读者证号 <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="reader_card"
                  class="input"
                  placeholder="请输入读者证号"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  申请馆 <span class="text-red-500">*</span>
                </label>
                <select name="requesting_library_id" class="select" required>
                  <option value="">请选择申请馆</option>
                  <For each={libraries()}>
                    {(lib) => <option value={lib.id}>{lib.name}</option>}
                  </For>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="text-lg font-semibold text-gray-900">图书信息</h2>
          </div>
          <div class="card-body space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                搜索图书
              </label>
              <div class="flex gap-2">
                <input
                  type="text"
                  class="input flex-1"
                  placeholder="输入书名、作者或ISBN搜索..."
                  value={searchQuery()}
                  onInput={(e) => setSearchQuery(e.currentTarget.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleBookSearch())}
                />
                <button
                  type="button"
                  class="btn-primary"
                  onClick={handleBookSearch}
                  disabled={searching()}
                >
                  {searching() ? "搜索中..." : "搜索"}
                </button>
              </div>
            </div>

            <Switch>
              <Match when={searching()}>
                <div class="text-center py-8 text-gray-500">搜索中...</div>
              </Match>
              <Match when={searchResults().length > 0}>
                <div class="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
                  <For each={searchResults()}>
                    {(book) => (
                      <label class="flex items-start p-4 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="book_id"
                          value={book.id}
                          checked={selectedBook() === book.id}
                          onChange={() => setSelectedBook(book.id)}
                          class="mt-1 mr-3"
                          required
                        />
                        <div class="flex-1">
                          <p class="font-medium text-gray-900">{book.title}</p>
                          <p class="text-sm text-gray-500">{book.author} · {book.publisher}</p>
                          <p class="text-xs text-gray-400">ISBN: {book.isbn} | 馆藏地: {book.location}</p>
                        </div>
                      </label>
                    )}
                  </For>
                </div>
              </Match>
              <Match when={searchQuery() && searchResults().length === 0 && !searching()}>
                <div class="text-center py-8 text-gray-500">未找到相关图书</div>
              </Match>
            </Switch>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="text-lg font-semibold text-gray-900">申请信息</h2>
          </div>
          <div class="card-body space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  借阅用途 <span class="text-red-500">*</span>
                </label>
                <select name="purpose" class="select" required>
                  <option value="">请选择用途</option>
                  <option value="research">教学科研</option>
                  <option value="study">学习参考</option>
                  <option value="thesis">论文写作</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  期望到馆日期
                </label>
                <input
                  type="date"
                  name="required_date"
                  class="input"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <A href="/requests" class="btn-secondary">
            取消
          </A>
          <button type="submit" class="btn-primary">
            提交申请
          </button>
        </div>
      </form>
    </div>
  );
}
