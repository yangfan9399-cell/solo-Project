import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useSpecimenStore } from '@/store/useSpecimenStore'
import type { Specimen } from '@/types'
import {
  MapPin,
  Mountain,
  TreePine,
  Droplets,
  Calendar,
  User,
  Repeat,
  Eye,
  Layers,
  CloudRain,
  Sun,
  Cloud,
  Waves,
} from 'lucide-react'

interface SpecimenCardProps {
  specimen: Specimen
}

const statusColors: Record<string, string> = {
  '待接收': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  '复判中': 'bg-blue-100 text-blue-800 border-blue-200',
  '已锁定': 'bg-green-100 text-green-800 border-green-200',
  '已退回': 'bg-red-100 text-red-800 border-red-200',
}

const sporeDensityValues: Record<string, number> = {
  '高': 100,
  '中': 66,
  '低': 33,
  '无': 0,
}

const substrateIcons: Record<string, React.ReactNode> = {
  '树皮': <TreePine className="h-4 w-4" />,
  '岩石': <Mountain className="h-4 w-4" />,
  '土壤': <Layers className="h-4 w-4" />,
  '苔藓层': <Cloud className="h-4 w-4" />,
}

const humidityIcons: Record<string, React.ReactNode> = {
  '干燥': <Sun className="h-4 w-4" />,
  '适中': <Cloud className="h-4 w-4" />,
  '湿润': <CloudRain className="h-4 w-4" />,
  '水淹': <Waves className="h-4 w-4" />,
}

const PLACEHOLDER_IMAGE = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lichen%20micrograph%20scientific%20slide&image_size=square'

export function SpecimenCard({ specimen }: SpecimenCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(specimen.id) })

  const toggleSelectSpecimen = useSpecimenStore((state) => state.toggleSelectSpecimen)
  const selectedSpecimenIds = useSpecimenStore((state) => state.selectedSpecimenIds)
  const openDetail = useSpecimenStore((state) => state.openDetail)

  const isSelected = selectedSpecimenIds.includes(specimen.id)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleCheckboxChange = () => {
    toggleSelectSpecimen(specimen.id)
  }

  const handleViewDetail = () => {
    openDetail(specimen)
  }

  const belongsToChanged = specimen.original_belongs_to && 
    specimen.current_belongs_to && 
    specimen.original_belongs_to !== specimen.current_belongs_to

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="w-full cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200"
      {...attributes}
      {...listeners}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">
              {specimen.specimen_no}
            </span>
            <Badge
              variant="outline"
              className={`${statusColors[specimen.status]} text-xs`}
            >
              {specimen.status}
            </Badge>
            {specimen.is_remeasure && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Repeat className="h-3 w-3" />
                复测
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
          <img
            src={specimen.micrograph_url || PLACEHOLDER_IMAGE}
            alt={`${specimen.specimen_no} 显微切片`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = PLACEHOLDER_IMAGE
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>采集点</span>
            </div>
            <div className="font-medium truncate">
              {specimen.collection_point || '-'}
              {specimen.collection_coords && (
                <span className="text-muted-foreground font-normal ml-1">
                  ({specimen.collection_coords.lat.toFixed(2)}, {specimen.collection_coords.lng.toFixed(2)})
                </span>
              )}
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Mountain className="h-3 w-3" />
              <span>海拔</span>
            </div>
            <div className="font-medium">
              {specimen.collection_altitude != null ? `${specimen.collection_altitude} 米` : '-'}
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-muted-foreground">
              {substrateIcons[specimen.substrate || ''] || <TreePine className="h-3 w-3" />}
              <span>基质</span>
            </div>
            <div className="font-medium">
              {specimen.substrate || '-'}
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Layers className="h-3 w-3" />
              <span>孢子密度</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{specimen.spore_density || '-'}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{
                    width: `${sporeDensityValues[specimen.spore_density || ''] || 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-muted-foreground">
              {humidityIcons[specimen.humidity_exposure || ''] || <Droplets className="h-3 w-3" />}
              <span>湿度暴露</span>
            </div>
            <div className="font-medium">
              {specimen.humidity_exposure || '-'}
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span>采集来源</span>
            </div>
            <div className="font-medium">
              {specimen.collection_source || '-'}
            </div>
          </div>

          <div className="space-y-0.5 col-span-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>采集季节 / 日期</span>
            </div>
            <div className="font-medium">
              {specimen.season || '-'} / {formatDate(specimen.collection_date)}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t space-y-2">
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span>原始归属</span>
            </div>
            <div className="font-medium">
              {specimen.original_belongs_to || '-'}
            </div>
          </div>

          <div className="text-xs space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span>当前归属</span>
            </div>
            <div className={`font-medium ${belongsToChanged ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded' : ''}`}>
              {specimen.current_belongs_to || '-'}
              {belongsToChanged && <span className="ml-1 text-xs">(已变更)</span>}
            </div>
          </div>
        </div>

        {specimen.interpreter_opinion && (
          <div className="pt-2 border-t">
            <div className="text-xs space-y-1">
              <div className="text-muted-foreground">判读意见</div>
              <div className="text-sm bg-muted/50 p-2 rounded-md">
                {specimen.interpreter_opinion}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-3">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
            id={`select-${specimen.id}`}
          />
          <label
            htmlFor={`select-${specimen.id}`}
            className="text-xs text-muted-foreground cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            选择
          </label>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1"
          onClick={(e) => {
            e.stopPropagation()
            handleViewDetail()
          }}
        >
          <Eye className="h-4 w-4" />
          详情
        </Button>
      </CardFooter>
    </Card>
  )
}
