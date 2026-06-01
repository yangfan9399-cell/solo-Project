import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, Send, X } from 'lucide-react'
import { useApi, useApiPost } from '@/hooks/useApi'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import type { PartnerLibrary, LibraryHolding } from '@/types'

interface CreateRequestBody {
  isbn: string
  title: string
  author: string
  publisher: string
  reader_name: string
  reader_phone: string
  reader_email: string
  library_id: number
  request_type: string
  purpose: string
  due_date: string
  notes: string
}

export default function RequestNew() {
  const navigate = useNavigate()
  const { data: libraries, loading: librariesLoading, error: librariesError } = useApi<PartnerLibrary[]>('/api/libraries')
  const { post: postMatch, loading: matchLoading, data: matchData } = useApiPost<LibraryHolding[]>('')
  const { post: postCreate, loading: createLoading, error: createError } = useApiPost<void, CreateRequestBody>('')

  const [isbn, setIsbn] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [publisher, setPublisher] = useState('')
  const [readerName, setReaderName] = useState('')
  const [readerPhone, setReaderPhone] = useState('')
  const [readerEmail, setReaderEmail] = useState('')
  const [libraryId, setLibraryId] = useState<number | ''>('')
  const [requestType, setRequestType] = useState('borrow')
  const [purpose, setPurpose] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({})

  const handleMatch = () => {
    if (!isbn.trim()) return
    postMatch(`/api/match/${isbn.trim()}`)
  }

  const handleSelectHolding = (holding: LibraryHolding) => {
    setTitle(holding.title)
    setAuthor(holding.author)
    setPublisher(holding.publisher)
  }

  const validate = () => {
    const errors: Record<string, boolean> = {}
    if (!readerName.trim()) errors.readerName = true
    if (!isbn.trim()) errors.isbn = true
    if (!title.trim()) errors.title = true
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    if (!libraryId) return

    const result = await postCreate('/api/requests', {
      isbn: isbn.trim(),
      title: title.trim(),
      author: author.trim(),
      publisher: publisher.trim(),
      reader_name: readerName.trim(),
      reader_phone: readerPhone.trim(),
      reader_email: readerEmail.trim(),
      library_id: libraryId as number,
      request_type: requestType,
      purpose: purpose.trim(),
      due_date: dueDate,
      notes: notes.trim(),
    })

    if (result !== null) {
      navigate('/requests')
    }
  }

  if (librariesLoading) return <LoadingSpinner text="加载中..." />
  if (librariesError) return <ErrorState message={librariesError} />

  const inputBase = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors'
  const inputError = 'border-red-400 ring-1 ring-red-400'
  const inputNormal = 'border-slate-300'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">新建互借申请</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-medium text-slate-700 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          图书信息
        </h2>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="请输入ISBN"
            value={isbn}
            onChange={(e) => { setIsbn(e.target.value); setValidationErrors((p) => ({ ...p, isbn: false })) }}
            className={`${inputBase} ${validationErrors.isbn ? inputError : inputNormal}`}
          />
          <button
            onClick={handleMatch}
            disabled={matchLoading || !isbn.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
          >
            <Search className="w-4 h-4" />
            {matchLoading ? '匹配中...' : '匹配馆藏'}
          </button>
        </div>

        {matchData && matchData.length > 0 && (
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
            {matchData.map((h) => (
              <button
                key={h.id}
                onClick={() => handleSelectHolding(h)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{h.library_name || `馆ID: ${h.library_id}`}</p>
                  <p className="text-xs text-slate-500">索书号: {h.call_number}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${h.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {h.available ? '可借' : '不可借'}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">书名 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setValidationErrors((p) => ({ ...p, title: false })) }}
              className={`${inputBase} ${validationErrors.title ? inputError : inputNormal}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">作者</label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className={`${inputBase} ${inputNormal}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">出版社</label>
            <input type="text" value={publisher} onChange={(e) => setPublisher(e.target.value)} className={`${inputBase} ${inputNormal}`} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-medium text-slate-700">读者与申请信息</h2>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">读者姓名 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={readerName}
              onChange={(e) => { setReaderName(e.target.value); setValidationErrors((p) => ({ ...p, readerName: false })) }}
              className={`${inputBase} ${validationErrors.readerName ? inputError : inputNormal}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">电话</label>
            <input type="tel" value={readerPhone} onChange={(e) => setReaderPhone(e.target.value)} className={`${inputBase} ${inputNormal}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">邮箱</label>
            <input type="email" value={readerEmail} onChange={(e) => setReaderEmail(e.target.value)} className={`${inputBase} ${inputNormal}`} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">目标合作馆</label>
            <select
              value={libraryId}
              onChange={(e) => setLibraryId(Number(e.target.value))}
              className={`${inputBase} ${inputNormal}`}
            >
              <option value="">请选择合作馆</option>
              {libraries?.map((lib) => (
                <option key={lib.id} value={lib.id}>{lib.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">申请类型</label>
            <select value={requestType} onChange={(e) => setRequestType(e.target.value)} className={`${inputBase} ${inputNormal}`}>
              <option value="borrow">借阅</option>
              <option value="copy">复印</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">期望到期日</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`${inputBase} ${inputNormal}`} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">用途</label>
          <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} className={`${inputBase} ${inputNormal}`} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">备注</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputBase} ${inputNormal}`} />
        </div>
      </div>

      {createError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {createError}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSubmit}
          disabled={createLoading}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {createLoading ? '提交中...' : '提交申请'}
        </button>
        <button
          onClick={() => navigate('/requests')}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <X className="w-4 h-4" />
          取消
        </button>
      </div>
    </div>
  )
}
