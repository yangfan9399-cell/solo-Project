import { json, LoaderFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { prisma } from '~/db.server';

export const loader: LoaderFunction = async () => {
  const items = await prisma.lostItem.findMany({
    include: {
      claimRequests: true,
    },
    orderBy: {
      foundAt: 'desc',
    },
  });

  const statusCounts = await prisma.lostItem.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });

  const counts: Record<string, number> = {};
  statusCounts.forEach((item) => {
    counts[item.status] = item._count.id;
  });

  return json({ items, counts });
};

function getStatusBadge(status: string) {
  const badges: Record<string, { class: string; label: string }> = {
    FOUND: { class: 'badge-found', label: '已拾获' },
    CLAIMED: { class: 'badge-claimed', label: '已申请认领' },
    VERIFIED: { class: 'badge-verified', label: '已核验' },
    RETURNED: { class: 'badge-returned', label: '已交还' },
    EXPIRED: { class: 'badge-expired', label: '已超期' },
    TRANSFERRED: { class: 'badge-transferred', label: '已移交' },
    ARCHIVED: { class: 'badge-transferred', label: '已归档' },
  };
  const badge = badges[status];
  return badge ? (
    <span className={`badge ${badge.class}`}>{badge.label}</span>
  ) : null;
}

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

function formatDate(date: Date) {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Index() {
  const { items, counts } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="status-bar">
        <div className="status-item">
          <div className="count">{counts.FOUND || 0}</div>
          <div className="label">待认领</div>
        </div>
        <div className="status-item">
          <div className="count">{counts.CLAIMED || 0}</div>
          <div className="label">申请认领中</div>
        </div>
        <div className="status-item">
          <div className="count">{counts.VERIFIED || 0}</div>
          <div className="label">待交还</div>
        </div>
        <div className="status-item">
          <div className="count">{counts.RETURNED || 0}</div>
          <div className="label">已交还</div>
        </div>
        <div className="status-item">
          <div className="count">{counts.EXPIRED || 0}</div>
          <div className="label">已超期</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <h2>遗失物列表</h2>
          <Link to="/register">
            <button className="btn btn-primary">登记新物品</button>
          </Link>
        </div>

        <table>
          <thead>
            <tr>
              <th>物品名称</th>
              <th>类别</th>
              <th>拾获位置</th>
              <th>保管柜</th>
              <th>拾获时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.isValuable && <span style={{ color: '#dc3545', marginRight: 5 }}>★</span>}
                  {item.name}
                </td>
                <td>{getCategoryLabel(item.category)}</td>
                <td>{item.foundLocation}</td>
                <td>{item.lockerNumber}</td>
                <td>{formatDate(item.foundAt)}</td>
                <td>{getStatusBadge(item.status)}</td>
                <td>
                  <Link to={`/items/${item.id}`}>
                    <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>
                      详情
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
