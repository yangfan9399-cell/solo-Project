import { json, LoaderFunction } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import { prisma } from '~/db.server';

export const loader: LoaderFunction = async () => {
  const items = await prisma.lostItem.findMany({
    include: {
      claimRequests: true,
    },
  });

  const byCategory = await prisma.lostItem.groupBy({
    by: ['category'],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  });

  const byStatus = await prisma.lostItem.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });

  const byLineData = await prisma.lostItem.groupBy({
    by: ['foundLocation'],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  });

  const totalItems = items.length;
  const returnedItems = items.filter((i) => i.status === 'RETURNED').length;
  const expiredItems = items.filter((i) => i.status === 'EXPIRED').length;
  const claimedItems = items.filter((i) => i.claimRequests.length > 0).length;

  return json({
    items,
    byLineData,
    byCategory,
    byStatus,
    totalItems,
    returnedItems,
    expiredItems,
    claimedItems,
  });
};

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    ELECTRONICS: '电子产品',
    DOCUMENTS: '证件文件',
    BAGS: '箱包',
    CLOTHING: '衣物',
    JEWELRY: '首饰',
    WALLET: '钱包',
    OTHER: '其他',
  };
  return labels[category] || category;
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    FOUND: '已拾获',
    CLAIMED: '已申请认领',
    VERIFIED: '已核验',
    RETURNED: '已交还',
    EXPIRED: '已超期',
    TRANSFERRED: '已移交',
    ARCHIVED: '已归档',
  };
  return labels[status] || status;
}

function getLineFromLocation(location: string) {
  const match = location.match(/(\d+号线)/);
  return match ? match[1] : '其他';
}

function calculateStats(items: Array<{ foundAt: Date; status: string; claimRequests: Array<unknown> }>) {
  const lineMap: Record<string, number> = {};
  const stationMap: Record<string, number> = {};
  let totalDays = 0;
  let claimed = 0;
  let returned = 0;

  items.forEach((item) => {
    const line = getLineFromLocation(item.foundLocation);
    lineMap[line] = (lineMap[line] || 0) + 1;
    stationMap[item.foundLocation] = (stationMap[item.foundLocation] || 0) + 1;
    
    const days = Math.floor((new Date().getTime() - new Date(item.foundAt).getTime()) / (1000 * 60 * 60 * 24));
    totalDays += days;
    
    if (item.claimRequests.length > 0) claimed++;
    if (item.status === 'RETURNED') returned++;
  });

  const byLine = Object.entries(lineMap).map(([line, count]) => ({ line, count })).sort((a, b) => b.count - a.count);
  const byStation = Object.entries(stationMap).map(([foundLocation, count]) => ({ foundLocation, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  const avgStorageDays = items.length > 0 ? Math.round(totalDays / items.length) : 0;
  const claimRate = items.length > 0 ? Math.round((claimed / items.length) * 100) : 0;
  const returnRate = items.length > 0 ? Math.round((returned / items.length) * 100) : 0;

  return { byLine, byStation, avgStorageDays, claimRate, returnRate };
}

export default function Review() {
  const { items, byCategory, byStatus, totalItems } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedLine = searchParams.get('line') || 'all';
  const selectedCategory = searchParams.get('category') || 'all';
  const minDays = parseInt(searchParams.get('minDays') || '0');
  const maxDays = parseInt(searchParams.get('maxDays') || '30');

  const filteredItems = items.filter((item) => {
    const line = getLineFromLocation(item.foundLocation);
    if (selectedLine !== 'all' && line !== selectedLine) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    
    const storageDays = Math.floor((new Date().getTime() - new Date(item.foundAt).getTime()) / (1000 * 60 * 60 * 24));
    if (storageDays < minDays || storageDays > maxDays) return false;
    
    return true;
  });

  const { byLine, byStation, avgStorageDays, claimRate, returnRate } = calculateStats(filteredItems);

  const lines = [...new Set(items.map((item) => getLineFromLocation(item.foundLocation)))];
  const categories = [...new Set(items.map((item) => item.category))];

  const handleFilterChange = (key: string, value: string | number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set(key, String(value));
    setSearchParams(newParams);
  };

  return (
    <div>
      <div className="filter-bar">
        <select 
          value={selectedLine} 
          onChange={(e) => handleFilterChange('line', e.target.value)}
        >
          <option value="all">全部线路</option>
          {lines.map((line) => (
            <option key={line} value={line}>{line}</option>
          ))}
        </select>
        <select 
          value={selectedCategory} 
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="all">全部类别</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span>保管天数：</span>
          <input
            type="number"
            value={minDays}
            onChange={(e) => handleFilterChange('minDays', e.target.value)}
            style={{ width: 60, padding: '4px' }}
          />
          <span>-</span>
          <input
            type="number"
            value={maxDays}
            onChange={(e) => handleFilterChange('maxDays', e.target.value)}
            style={{ width: 60, padding: '4px' }}
          />
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="value">{filteredItems.length}</div>
          <div className="label">物品总数</div>
        </div>
        <div className="summary-card">
          <div className="value">{avgStorageDays}</div>
          <div className="label">平均保管天数</div>
        </div>
        <div className="summary-card">
          <div className="value">{claimRate}%</div>
          <div className="label">认领率</div>
        </div>
        <div className="summary-card">
          <div className="value">{returnRate}%</div>
          <div className="label">交还率</div>
        </div>
      </div>

      <div className="card">
        <h3>按线路统计</h3>
        <table style={{ marginTop: 15 }}>
          <thead>
            <tr>
              <th>线路</th>
              <th>物品数量</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {byLine.map((item) => (
              <tr key={item.line}>
                <td>{item.line}</td>
                <td>{item.count}</td>
                <td>{((item.count / filteredItems.length) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>按站点统计（Top 10）</h3>
        <table style={{ marginTop: 15 }}>
          <thead>
            <tr>
              <th>站点</th>
              <th>物品数量</th>
            </tr>
          </thead>
          <tbody>
            {byStation.map((item) => (
              <tr key={item.foundLocation}>
                <td>{item.foundLocation}</td>
                <td>{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>按物品类别统计</h3>
        <table style={{ marginTop: 15 }}>
          <thead>
            <tr>
              <th>类别</th>
              <th>物品数量</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {byCategory.map((item) => (
              <tr key={item.category}>
                <td>{getCategoryLabel(item.category)}</td>
                <td>{item._count.id}</td>
                <td>{((item._count.id / totalItems) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>按状态统计</h3>
        <table style={{ marginTop: 15 }}>
          <thead>
            <tr>
              <th>状态</th>
              <th>物品数量</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {byStatus.map((item) => (
              <tr key={item.status}>
                <td>{getStatusLabel(item.status)}</td>
                <td>{item._count.id}</td>
                <td>{((item._count.id / totalItems) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>保管天数分布</h3>
        <table style={{ marginTop: 15 }}>
          <thead>
            <tr>
              <th>保管天数区间</th>
              <th>物品数量</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {[
              { min: 0, max: 3, label: '0-3天' },
              { min: 4, max: 7, label: '4-7天' },
              { min: 8, max: 10, label: '8-10天' },
              { min: 11, max: 30, label: '11-30天' },
              { min: 31, max: 999, label: '30天以上' },
            ].map((range) => {
              const count = filteredItems.filter((item) => {
                const days = Math.floor((new Date().getTime() - new Date(item.foundAt).getTime()) / (1000 * 60 * 60 * 24));
                return days >= range.min && days <= range.max;
              }).length;
              return (
                <tr key={range.label}>
                  <td>{range.label}</td>
                  <td>{count}</td>
                  <td>{filteredItems.length > 0 ? ((count / filteredItems.length) * 100).toFixed(1) : 0}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
