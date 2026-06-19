import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SpecimenCard } from '@/components/SpecimenCard'
import type { Specimen, SpecimenStatus } from '@/types'
import { Inbox } from 'lucide-react'

interface StatusColumnProps {
  status: SpecimenStatus
  specimens: Specimen[]
  isOver?: boolean
}

const statusStyles: Record<string, { header: string; bg: string; border: string }> = {
  '待接收': {
    header: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    bg: 'bg-yellow-50/30',
    border: 'border-yellow-200',
  },
  '复判中': {
    header: 'bg-blue-50 border-blue-200 text-blue-800',
    bg: 'bg-blue-50/30',
    border: 'border-blue-200',
  },
  '已锁定': {
    header: 'bg-green-50 border-green-200 text-green-800',
    bg: 'bg-green-50/30',
    border: 'border-green-200',
  },
  '已退回': {
    header: 'bg-red-50 border-red-200 text-red-800',
    bg: 'bg-red-50/30',
    border: 'border-red-200',
  },
}

export function StatusColumn({ status, specimens, isOver }: StatusColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  })

  const style = statusStyles[status]
  const specimenIds = specimens.map((s) => String(s.id))

  return (
    <div className="flex flex-col h-full min-w-[320px] w-full md:w-1/4 lg:w-1/4">
      <div
        className={`flex items-center justify-between px-4 py-3 rounded-t-lg border-b ${style.header}`}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{status}</h3>
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-medium bg-white/80 rounded-full">
            {specimens.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-3 rounded-b-lg border border-t-0 transition-all duration-200 ${style.bg} ${style.border} ${
          isOver ? 'ring-2 ring-inset ring-primary/50' : ''
        }`}
      >
        {specimens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Inbox className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">暂无标本</p>
            <p className="text-xs">拖拽标本到此处</p>
          </div>
        ) : (
          <SortableContext items={specimenIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {specimens.map((specimen) => (
                <SpecimenCard key={specimen.id} specimen={specimen} />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  )
}
