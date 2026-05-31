import { component$ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import { useAuth } from '~/context/auth';
import {
  LayoutDashboard,
  ThermometerSnowflake,
  Package,
  Truck,
  ClipboardCheck,
  RotateCcw,
  FileBarChart,
  Users,
} from 'lucide-qwik';

interface NavItem {
  label: string;
  path: string;
  icon: any;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: '仪表盘', path: '/', icon: LayoutDashboard, roles: ['cold_chain_admin', 'cdc_reviewer', 'vaccination_site_manager'] },
  { label: '冷库台账', path: '/cold-storages', icon: ThermometerSnowflake, roles: ['cold_chain_admin'] },
  { label: '转运箱管理', path: '/transport-boxes', icon: Truck, roles: ['cold_chain_admin'] },
  { label: '温控偏差', path: '/deviations', icon: ThermometerSnowflake, roles: ['cold_chain_admin', 'cdc_reviewer'] },
  { label: '批次隔离', path: '/quarantine', icon: Package, roles: ['cold_chain_admin'] },
  { label: '复核放行', path: '/review', icon: ClipboardCheck, roles: ['cdc_reviewer'] },
  { label: '召回协同', path: '/recall', icon: RotateCcw, roles: ['cdc_reviewer', 'vaccination_site_manager'] },
  { label: '追溯报表', path: '/trace', icon: FileBarChart, roles: ['cold_chain_admin', 'cdc_reviewer'] },
  { label: '接种点库存', path: '/inventory', icon: Package, roles: ['vaccination_site_manager', 'cdc_reviewer'] },
];

export const Sidebar = component$(() => {
  const location = useLocation();
  const { state } = useAuth();

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(state.currentRole)
  );

  return (
    <aside class="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div class="p-6 border-b border-gray-200">
        <h1 class="text-xl font-bold text-primary-600">疫苗冷链系统</h1>
        <p class="text-sm text-gray-500 mt-1">县域疾控中心</p>
      </div>
      
      <nav class="flex-1 p-4 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = location.url.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              class={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon class="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
});
