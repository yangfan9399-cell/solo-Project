import { Download, FileCheck, FileX, CheckCircle2, AlertCircle } from 'lucide-react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useSpecimenStore } from '@/store/useSpecimenStore'

export function ExportPreviewDialog() {
  const {
    showExportDialog,
    closeExportDialog,
    isLoading,
    error,
    setError,
    exportPreview,
    lastExportBatch,
    executeExport,
  } = useSpecimenStore()

  const handleExport = async () => {
    await executeExport()
  }

  const handleClose = () => {
    closeExportDialog()
    setError(null)
  }

  const exportableCount = exportPreview?.exportable.length || 0
  const excludedCount = exportPreview?.excluded.length || 0

  return (
    <Dialog open={showExportDialog} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            导出预览
          </DialogTitle>
          <DialogDescription>
            导出前请确认可导出项和被排除项
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {lastExportBatch && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">导出成功</AlertTitle>
            <AlertDescription className="text-green-700">
              批次号：<span className="font-mono font-bold">{lastExportBatch.batch_no}</span>
            </AlertDescription>
          </Alert>
        )}

        {isLoading && !exportPreview ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
            <span>加载中...</span>
          </div>
        ) : exportPreview ? (
          <>
            <Tabs defaultValue="exportable" className="flex-1 flex flex-col min-h-0">
              <TabsList>
                <TabsTrigger value="exportable" className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  可导出列表
                  <Badge variant="secondary" className="ml-1">{exportableCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="excluded" className="flex items-center gap-2">
                  <FileX className="h-4 w-4" />
                  被排除列表
                  <Badge variant="destructive" className="ml-1">{excludedCount}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="exportable" className="flex-1 min-h-0">
                {exportPreview.exportable.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileCheck className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">暂无可导出的标本</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      只有状态为"已锁定"的标本可以导出
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[350px] border rounded-md">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead className="w-[120px]">标本编号</TableHead>
                          <TableHead>采集点</TableHead>
                          <TableHead>归属地</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exportPreview.exportable.map((specimen) => (
                          <TableRow key={specimen.id}>
                            <TableCell className="font-mono text-sm">
                              {specimen.specimen_no}
                            </TableCell>
                            <TableCell className="text-sm">
                              {specimen.collection_point}
                            </TableCell>
                            <TableCell className="text-sm">
                              {specimen.current_belongs_to}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="excluded" className="flex-1 min-h-0">
                {exportPreview.excluded.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mb-4 opacity-50 text-green-500" />
                    <p className="text-sm">所有选中的标本都可以导出</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[350px] border rounded-md">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead className="w-[120px]">标本编号</TableHead>
                          <TableHead>排除原因</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exportPreview.excluded.map((item) => (
                          <TableRow key={item.specimen_id}>
                            <TableCell className="font-mono text-sm">
                              {item.specimen_no}
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive" className="text-xs">
                                {item.reason}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between py-2 border-t">
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <FileCheck className="h-3 w-3" />
                  可导出 {exportableCount} 条
                </Badge>
                <Badge variant="destructive" className="flex items-center gap-1">
                  <FileX className="h-3 w-3" />
                  被排除 {excludedCount} 条
                </Badge>
              </div>
            </div>
          </>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {lastExportBatch ? '关闭' : '取消'}
          </Button>
          {!lastExportBatch && (
            <Button
              onClick={handleExport}
              disabled={exportableCount === 0 || isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? '导出中...' : '执行导出'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
