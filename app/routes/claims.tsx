import { json, LoaderFunction } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { prisma } from '~/db.server';

export const loader: LoaderFunction = async () => {
  const claims = await prisma.claimRequest.findMany({
    include: {
      item: {
        include: {
          claimRequests: true,
        },
      },
    },
    orderBy: {
      claimedAt: 'desc',
    },
  });

  const pendingCount = await prisma.claimRequest.count({
    where: { verified: false },
  });

  const approvedCount = await prisma.claimRequest.count({
    where: { verified: true },
  });

  return json({ claims, pendingCount, approvedCount });
};

function formatDate(date: Date) {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadge(verified: boolean | null) {
  if (verified === null) return <span className="badge badge-claimed">待核验</span>;
  if (verified) return <span className="badge badge-success">已通过</span>;
  return <span className="badge badge-danger">未通过</span>;
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

export default function Claims() {
  const { claims, pendingCount, approvedCount } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="status-bar">
        <div className="status-item">
          <div className="count">{claims.length}</div>
          <div className="label">总申请数</div>
        </div>
        <div className="status-item">
          <div className="count">{pendingCount}</div>
          <div className="label">待核验</div>
        </div>
        <div className="status-item">
          <div className="count">{approvedCount}</div>
          <div className="label">已通过</div>
        </div>
        <div className="status-item">
          <div className="count">{claims.length - pendingCount - approvedCount}</div>
          <div className="label">未通过</div>
        </div>
      </div>

      <div className="card">
        <h2>认领申请列表</h2>
        <table>
          <thead>
            <tr>
              <th>物品名称</th>
              <th>物品类别</th>
              <th>拾获位置</th>
              <th>认领人</th>
              <th>联系电话</th>
              <th>申请时间</th>
              <th>核验状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.id}>
                <td>
                  {claim.item.isValuable && <span style={{ color: '#dc3545', marginRight: 5 }}>★</span>}
                  {claim.item.name}
                </td>
                <td>{getCategoryLabel(claim.item.category)}</td>
                <td>{claim.item.foundLocation}</td>
                <td>{claim.claimantName}</td>
                <td>{claim.claimantPhone}</td>
                <td>{formatDate(claim.claimedAt)}</td>
                <td>{getStatusBadge(claim.verified)}</td>
                <td>
                  <Link to={`/items/${claim.itemId}`}>
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
