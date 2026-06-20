import React from 'react';
import {
  Package,
  FileText,
  AlertTriangle,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
  Eye,
  Shield,
  Compass,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store';
import { PackageDimension, ReleaseStatus } from '../../shared/types';
import { dimensionTextMap, statusTextMap } from '../../utils/format';

interface SidebarProps {
  className?: string;
}

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  badgeColor?: string;
  children?: MenuItem[];
}

const dimensionItems: MenuItem[] = [
  { key: PackageDimension.clarity, label: dimensionTextMap[PackageDimension.clarity], icon: <Eye className="w-4 h-4" /> },
  { key: PackageDimension.rust_level, label: dimensionTextMap[PackageDimension.rust_level], icon: <Shield className="w-4 h-4" /> },
  { key: PackageDimension.inscription, label: dimensionTextMap[PackageDimension.inscription], icon: <FileText className="w-4 h-4" /> },
  { key: PackageDimension.orientation, label: dimensionTextMap[PackageDimension.orientation], icon: <Compass className="w-4 h-4" /> },
];

const statusItems: MenuItem[] = [
  { key: ReleaseStatus.published, label: statusTextMap[ReleaseStatus.published], icon: <Package className="w-4 h-4" />, badgeColor: 'bg-bronze-500' },
  { key: ReleaseStatus.pending, label: statusTextMap[ReleaseStatus.pending], icon: <Layers className="w-4 h-4" />, badgeColor: 'bg-stoneBlue-500' },
  { key: ReleaseStatus.blocked, label: statusTextMap[ReleaseStatus.blocked], icon: <AlertTriangle className="w-4 h-4" />, badgeColor: 'bg-cinnabar-500' },
  { key: ReleaseStatus.draft, label: statusTextMap[ReleaseStatus.draft], icon: <FileText className="w-4 h-4" />, badgeColor: 'bg-ink-400' },
  { key: ReleaseStatus.rolled_back, label: statusTextMap[ReleaseStatus.rolled_back], icon: <History className="w-4 h-4" />, badgeColor: 'bg-ink-400' },
];

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { sidebarCollapsed, toggleSidebar, packages } = useAppStore();
  const [expandedSections, setExpandedSections] = React.useState<string[]>(['dimensions', 'status']);
  const [activeItem, setActiveItem] = React.useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const getStatusCount = (status: ReleaseStatus): number => {
    return packages.filter((p) => p.status === status).length;
  };

  return (
    <aside
      className={cn(
        'relative bg-paper-50 border-r border-ochre-200',
        'transition-all duration-300 ease-in-out',
        'flex flex-col',
        sidebarCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(139, 69, 19, 0.02) 0%, transparent 100%)`,
          }}
        />
      </div>

      <div className="relative flex-1 overflow-y-auto scrollbar-ancient py-4">
        <div className="px-3 mb-2">
          <button
            onClick={() => toggleSection('dimensions')}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg',
              'text-ochre-700 hover:bg-ochre-100/50 transition-colors'
            )}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-ochre-500" />
              {!sidebarCollapsed && (
                <span className="font-song font-medium text-sm">维度分类</span>
              )}
            </div>
            {!sidebarCollapsed && (
              <ChevronRight
                className={cn(
                  'w-4 h-4 text-ochre-400 transition-transform',
                  expandedSections.includes('dimensions') && 'rotate-90'
                )}
              />
            )}
          </button>

          {!sidebarCollapsed && expandedSections.includes('dimensions') && (
            <div className="mt-1 space-y-0.5">
              {dimensionItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveItem(item.key)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left',
                    'transition-all duration-200 text-sm',
                    activeItem === item.key
                      ? 'bg-ochre-100 text-ochre-800 font-medium'
                      : 'text-ochre-600 hover:bg-ochre-50 hover:text-ochre-800'
                  )}
                >
                  <span className="text-ochre-400">{item.icon}</span>
                  <span className="font-heiti">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-ochre-100 mx-3 my-2" />

        <div className="px-3 mb-2">
          <button
            onClick={() => toggleSection('status')}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg',
              'text-ochre-700 hover:bg-ochre-100/50 transition-colors'
            )}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-ochre-500" />
              {!sidebarCollapsed && (
                <span className="font-song font-medium text-sm">状态筛选</span>
              )}
            </div>
            {!sidebarCollapsed && (
              <ChevronRight
                className={cn(
                  'w-4 h-4 text-ochre-400 transition-transform',
                  expandedSections.includes('status') && 'rotate-90'
                )}
              />
            )}
          </button>

          {!sidebarCollapsed && expandedSections.includes('status') && (
            <div className="mt-1 space-y-0.5">
              {statusItems.map((item) => {
                const count = getStatusCount(item.key as ReleaseStatus);
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveItem(item.key)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left',
                      'transition-all duration-200 text-sm',
                      activeItem === item.key
                        ? 'bg-ochre-100 text-ochre-800 font-medium'
                        : 'text-ochre-600 hover:bg-ochre-50 hover:text-ochre-800'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-ochre-400">{item.icon}</span>
                      <span className="font-heiti">{item.label}</span>
                    </div>
                    <span
                      className={cn(
                        'w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center',
                        item.badgeColor
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {sidebarCollapsed && (
          <div className="px-3 space-y-1">
            {dimensionItems.slice(0, 2).map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveItem(item.key)}
                className={cn(
                  'w-full flex items-center justify-center py-2.5 rounded-lg',
                  'transition-all duration-200',
                  activeItem === item.key
                    ? 'bg-ochre-100 text-ochre-800'
                    : 'text-ochre-500 hover:bg-ochre-50 hover:text-ochre-800'
                )}
              >
                {item.icon}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative border-t border-ochre-200 p-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-ochre-100/50 cursor-pointer transition-colors">
          <Settings className="w-4 h-4 text-ochre-500" />
          {!sidebarCollapsed && (
            <span className="font-heiti text-sm text-ochre-600">设置</span>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className={cn(
            'absolute -right-3 top-1/2 -translate-y-1/2',
            'w-6 h-6 rounded-full bg-paper-50 border border-ochre-200',
            'flex items-center justify-center shadow-sm',
            'text-ochre-500 hover:text-ochre-700 hover:border-ochre-300',
            'transition-colors z-10'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
