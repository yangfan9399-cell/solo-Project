import { useState, useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import { StatusColumn } from '@/components/StatusColumn'
import { Button } from '@/components/ui/button'
import { useSpecimenStore } from '@/store/useSpecimenStore'
import type { Specimen, SpecimenStatus } from '@/types'
import {
  UserPlus,
  XCircle,
  FileOutput,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react'

const STATUSES = ['待接收', '复判中', '已锁定', '已退回'] as const

export function KanbanBoard() {
  const specimens = useSpecimenStore((state) => state.specimens)
  const selectedSpecimenIds = useSpecimenStore((state) => state.selectedSpecimenIds)
  const updateSpecimenStatus = useSpecimenStore((state) => state.updateSpecimenStatus)
  const selectAllSpecimens = useSpecimenStore((state) => state.selectAllSpecimens)
  const clearSelection = useSpecimenStore((state) => state.clearSelection)
  const openAssignDialog = useSpecimenStore((state) => state.openAssignDialog)
  const openRejectDialog = useSpecimenStore((state) => state.openRejectDialog)
  const openExportDialog = useSpecimenStore((state) => state.openExportDialog)
  const fetchSpecimens = useSpecimenStore((state) => state.fetchSpecimens)
  const setError = useSpecimenStore((state) => state.setError)
  const isLoading = useSpecimenStore((state) => state.isLoading)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const groupedSpecimens = useMemo(() => {
    const groups: Record<string, Specimen[]> = {
      '待接收': [],
      '复判中': [],
      '已锁定': [],
      '已退回': [],
    }

    specimens.forEach((specimen) => {
      if (groups[specimen.status]) {
        groups[specimen.status].push(specimen)
      }
    })

    return groups
  }, [specimens])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (over) {
      setOverId(String(over.id))
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)

    if (!over) return

    const specimenId = Number(active.id)
    const newStatus = over.id as SpecimenStatus

    if (!STATUSES.includes(newStatus as unknown as typeof STATUSES[number])) return

    const specimen = specimens.find((s) => s.id === specimenId)
    if (!specimen || specimen.status === newStatus) return

    updateSpecimenStatus(specimenId, newStatus)
  }

  const handleSelectAll = () => {
    if (selectedSpecimenIds.length === specimens.length) {
      clearSelection()
    } else {
      selectAllSpecimens(specimens.map((s) => s.id))
    }
  }

  const allSelected = specimens.length > 0 && selectedSpecimenIds.length === specimens.length

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleSelectAll}
            >
              {allSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
              {allSelected ? '取消全选' : '全选'}
            </Button>
            {selectedSpecimenIds.length > 0 && (
            <span className="text-sm text-muted-foreground">
              已选择 {selectedSpecimenIds.length} 项
            </span>
          )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => fetchSpecimens()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            disabled={selectedSpecimenIds.length === 0}
            onClick={openAssignDialog}
          >
            <UserPlus className="h-4 w-4" />
            批量分配
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            disabled={selectedSpecimenIds.length === 0}
            onClick={openRejectDialog}
          >
            <XCircle className="h-4 w-4" />
            批量退回
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={openExportDialog}
          >
            <FileOutput className="h-4 w-4" />
            导出预览
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full gap-4 p-4 overflow-x-auto">
            {STATUSES.map((status) => (
              <StatusColumn
                key={status}
                status={status}
                specimens={groupedSpecimens[status]}
                isOver={overId === status && activeId !== null}
              />
            ))}
          </div>
        </DndContext>
      </div>
    </div>
  )
}
