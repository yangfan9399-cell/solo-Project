import { useEffect } from 'react'
import { Header } from '@/components/Header'
import { KanbanBoard } from '@/components/KanbanBoard'
import { BatchAssignDialog } from '@/components/BatchAssignDialog'
import { BatchRejectDialog } from '@/components/BatchRejectDialog'
import { ExportPreviewDialog } from '@/components/ExportPreviewDialog'
import { SpecimenDetail } from '@/components/SpecimenDetail'
import { ReMeasureHistory } from '@/components/ReMeasureHistory'
import { useSpecimenStore } from '@/store/useSpecimenStore'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle } from 'lucide-react'

function App() {
  const {
    fetchSpecimens,
    fetchAssignments,
    fetchRejections,
    fetchExportBatches,
    showDetailSidebar,
    showHistory,
    isLoading,
    error,
    setError,
  } = useSpecimenStore()

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchSpecimens(),
        fetchAssignments(),
        fetchRejections(),
        fetchExportBatches(),
      ])
    }
    loadData()
  }, [fetchSpecimens, fetchAssignments, fetchRejections, fetchExportBatches])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-muted/30 flex flex-col">
        <Header />

        {error && (
          <div className="px-4 pt-4">
            <Alert variant="destructive" className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-sm hover:underline"
              >
                关闭
              </button>
            </Alert>
          </div>
        )}

        {isLoading && (
          <div className="px-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background px-4 py-2 rounded-lg border">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>加载中...</span>
            </div>
          </div>
        )}

        <main
          className={`flex-1 transition-all duration-300 ${
            showDetailSidebar ? 'pr-0 md:pr-[420px]' : ''
          }`}
        >
          <div className="h-[calc(100vh-88px)]">
            <KanbanBoard />
          </div>
        </main>

        <BatchAssignDialog />
        <BatchRejectDialog />
        <ExportPreviewDialog />
        <SpecimenDetail />
        <ReMeasureHistory />
      </div>
    </TooltipProvider>
  )
}

export default App
