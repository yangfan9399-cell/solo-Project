import { useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSpecimenStore } from '@/store/useSpecimenStore'
import type { User } from '@/types'

export function BatchAssignDialog() {
  const {
    showAssignDialog,
    closeAssignDialog,
    selectedSpecimenIds,
    specimens,
    isLoading,
    error,
    setError,
    users,
    batchAssign,
  } = useSpecimenStore()

  const [assignTo, setAssignTo] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const selectedSpecimens = specimens.filter((s) =>
    selectedSpecimenIds.includes(s.id)
  )

  const handleSubmit = async () => {
    if (!assignTo) return

    await batchAssign({
      assign_to: assignTo,
      notes: notes.trim() || undefined,
    })
    setAssignTo(null)
    setNotes('')
  }

  const handleClose = () => {
    closeAssignDialog()
    setAssignTo(null)
    setNotes('')
    setError(null)
  }

  const handleRemoveSpecimen = (specimenId: number) => {
    const store = useSpecimenStore.getState()
    store.toggleSelectSpecimen(specimenId)
  }

  return (
    <Dialog open={showAssignDialog} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            批量分配标本
          </DialogTitle>
          <DialogDescription>
            将选中的 {selectedSpecimens.length} 个标本分配给指定判读人员
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              已选择的标本
            </label>
            <ScrollArea className="h-32 border rounded-md p-3">
              <div className="flex flex-wrap gap-2">
                {selectedSpecimens.map((specimen) => (
                  <Badge
                    key={specimen.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {specimen.specimen_no}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveSpecimen(specimen.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              判读人 <span className="text-destructive">*</span>
            </label>
            <Select value={assignTo || ''} onValueChange={setAssignTo}>
              <SelectTrigger>
                <SelectValue placeholder="请选择判读人员" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user: User) => (
                  <SelectItem key={user.id} value={user.name}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span>{user.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({user.role})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">备注</label>
            <Textarea
              placeholder="可选：填写分配备注..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!assignTo || isLoading || selectedSpecimens.length === 0}
          >
            {isLoading ? '分配中...' : '确认分配'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
