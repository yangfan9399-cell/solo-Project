import { useState, useEffect, useCallback } from 'react'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(url: string) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`请求失败: ${res.status} ${res.statusText}`)
      }
      const json = await res.json()
      if (json.success) {
        setState({ data: json.data as T, loading: false, error: null })
      } else {
        setState({ data: null, loading: false, error: json.error || '请求失败' })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误'
      setState((prev) => ({ ...prev, loading: false, error: message }))
    }
  }, [url])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data: state.data, loading: state.loading, error: state.error, refetch: fetchData }
}

export function useApiPost<T, B = unknown>(_url: string) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const post = useCallback(
    async (url: string, body?: B): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          throw new Error(`请求失败: ${res.status} ${res.statusText}`)
        }
        const json = await res.json()
        if (json.success) {
          setState({ data: json.data as T, loading: false, error: null })
          return json.data as T
        } else {
          const errMsg = json.error || '请求失败'
          setState({ data: null, loading: false, error: errMsg })
          return null
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '未知错误'
        setState((prev) => ({ ...prev, loading: false, error: message }))
        return null
      }
    },
    [],
  )

  return { post, loading: state.loading, error: state.error, data: state.data }
}

export function useApiPut<T, B = unknown>(_url: string) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const put = useCallback(
    async (url: string, body?: B): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          throw new Error(`请求失败: ${res.status} ${res.statusText}`)
        }
        const json = await res.json()
        if (json.success) {
          setState({ data: json.data as T, loading: false, error: null })
          return json.data as T
        } else {
          const errMsg = json.error || '请求失败'
          setState({ data: null, loading: false, error: errMsg })
          return null
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '未知错误'
        setState((prev) => ({ ...prev, loading: false, error: message }))
        return null
      }
    },
    [],
  )

  return { put, loading: state.loading, error: state.error, data: state.data }
}
