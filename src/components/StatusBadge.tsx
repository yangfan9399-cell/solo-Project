import { ShipmentStatus, DeviationLevel, DeviationType, DisposalAction, ShipmentStatusLabels, DeviationLevelLabels, DeviationTypeLabels, DisposalActionLabels } from '@/lib/types'
import clsx from 'clsx'

interface StatusBadgeProps {
  type: 'shipment' | 'deviation-level' | 'deviation-type' | 'disposal'
  value: string
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  const getLabel = () => {
    switch (type) {
      case 'shipment':
        return ShipmentStatusLabels[value as keyof typeof ShipmentStatusLabels] || value
      case 'deviation-level':
        return DeviationLevelLabels[value as keyof typeof DeviationLevelLabels] || value
      case 'deviation-type':
        return DeviationTypeLabels[value as keyof typeof DeviationTypeLabels] || value
      case 'disposal':
        return DisposalActionLabels[value as keyof typeof DisposalActionLabels] || value
      default:
        return value
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'shipment':
        return getShipmentStyles(value)
      case 'deviation-level':
        return getDeviationLevelStyles(value)
      case 'deviation-type':
        return getDeviationTypeStyles(value)
      case 'disposal':
        return getDisposalStyles(value)
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        getStyles()
      )}
    >
      {getLabel()}
    </span>
  )
}

function getShipmentStyles(status: string): string {
  switch (status) {
    case ShipmentStatus.REGISTERED:
      return 'bg-blue-100 text-blue-800'
    case ShipmentStatus.TEMPERATURE_COLLECTED:
      return 'bg-cyan-100 text-cyan-800'
    case ShipmentStatus.DEVIATION_JUDGED:
      return 'bg-yellow-100 text-yellow-800'
    case ShipmentStatus.RELEASED:
      return 'bg-green-100 text-green-800'
    case ShipmentStatus.ISOLATED:
      return 'bg-orange-100 text-orange-800'
    case ShipmentStatus.RETURNED:
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getDeviationLevelStyles(level: string): string {
  switch (level) {
    case DeviationLevel.NONE:
      return 'bg-green-100 text-green-800'
    case DeviationLevel.MINOR:
      return 'bg-yellow-100 text-yellow-800'
    case DeviationLevel.MAJOR:
      return 'bg-orange-100 text-orange-800'
    case DeviationLevel.CRITICAL:
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getDeviationTypeStyles(type: string): string {
  switch (type) {
    case DeviationType.NONE:
      return 'bg-green-100 text-green-800'
    case DeviationType.TEMPERATURE_EXCEEDED:
      return 'bg-orange-100 text-orange-800'
    case DeviationType.PROBE_OFFLINE:
      return 'bg-red-100 text-red-800'
    case DeviationType.BATCH_MIXED:
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getDisposalStyles(action: string): string {
  switch (action) {
    case DisposalAction.PENDING:
      return 'bg-gray-100 text-gray-800'
    case DisposalAction.RELEASE:
      return 'bg-green-100 text-green-800'
    case DisposalAction.ISOLATE:
      return 'bg-orange-100 text-orange-800'
    case DisposalAction.RETURN:
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
