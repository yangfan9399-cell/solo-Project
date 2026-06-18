import { component$, Slot, useVisibleTask$, useSignal } from '@builder.io/qwik';
import { useLocation, Link } from '@builder.io/qwik-city';
import { initializeSeedData } from '~/utils/seed';
import { getAllAnomalies } from '~/utils/storage';

const navItems = [
  { href: '/', label: '📊 项目台账', matchPrefix: false },
  { href: '/regions', label: '🗺️ 地区样本库', matchPrefix: false },
];

export default component$(() => {
  const location = useLocation();
  const anomalyCount = useSignal(0);
  const currentPath = useSignal('');

  useVisibleTask$(() => {
    initializeSeedData();
    const anomalies = getAllAnomalies();
    anomalyCount.value = anomalies.filter((a) => !a.resolved).length;
  });

  useVisibleTask$(({ track }) => {
    track(() => location.url.pathname);
    currentPath.value = location.url.pathname;
  });

  const isActive = (href: string, matchPrefix: boolean) => {
    const path = currentPath.value;
    if (href === '/') return path === '/';
    if (matchPrefix) return path.startsWith(href);
    return path === href || path.startsWith(href + '/');
  };

  return (
    <div class="layout-container">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <h1>声调对齐平台</h1>
          <p>Dialect Tone Alignment</p>
        </div>
        <nav class="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              class={isActive(item.href, item.matchPrefix) ? 'active' : ''}
            >
              {item.label}
              {item.href === '/' && anomalyCount.value > 0 && isActive(item.href, item.matchPrefix) && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '6px',
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 6px',
                    borderRadius: '10px',
                    background: 'var(--danger)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {anomalyCount.value}
                </span>
              )}
            </Link>
          ))}
          {currentPath.value.startsWith('/project/') && (
            <div style={{ marginTop: '8px', paddingLeft: '20px', paddingRight: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>当前项目</div>
              <Link
                href={currentPath.value.split('/').slice(0, 3).join('/')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius)',
                  fontSize: '13px',
                  background: 'var(--primary-bg)',
                  color: 'var(--primary-light)',
                  textDecoration: 'none',
                }}
              >
                ← 返回项目
              </Link>
            </div>
          )}
        </nav>
        <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            数据存储于本地浏览器<br />
            localStorage 持久化
          </div>
        </div>
      </aside>
      <main class="main-content">
        <Slot />
      </main>
    </div>
  );
});
