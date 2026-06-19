import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSpecimenStore } from '@/store/useSpecimenStore'
import { specimenApi } from '@/lib/api'
import type { User } from '@/types'
import { RefreshCw, User as UserIcon, Leaf } from 'lucide-react'

export function Header() {
  const users = useSpecimenStore((state) => state.users)
  const currentUser = useSpecimenStore((state) => state.currentUser)
  const setCurrentUser = useSpecimenStore((state) => state.setCurrentUser)
  const setSpecimens = useSpecimenStore((state) => state.setSpecimens)
  const setLoading = useSpecimenStore((state) => state.setLoading)
  const setError = useSpecimenStore((state) => state.setError)
  const clearSelection = useSpecimenStore((state) => state.clearSelection)

  const handleRefresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await specimenApi.getSpecimens({ page_size: 100 })
      setSpecimens(response.data)
      clearSelection()
    } catch (error) {
      setError('加载标本列表失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleUserChange = (value: string | null) => {
    if (!value) return
    const user = users.find((u: User) => u.id === value)
    if (user) {
      setCurrentUser(user)
    }
  }

  return (
    <header className="border-b bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <Leaf className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                地衣标本样本工作台
              </h1>
              <p className="text-sm text-muted-foreground">
                地衣标本证据接收系统
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>判读人：</span>
            </div>
            <Select value={currentUser?.id || ''} onValueChange={handleUserChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {currentUser?.name || ''}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {users.map((user: User) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span>{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({user.role})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </header>
  )
}
