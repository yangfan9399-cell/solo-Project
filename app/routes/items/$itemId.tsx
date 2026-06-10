import { json, LoaderFunction, ActionFunction, redirect } from '@remix-run/node';
import { useLoaderData, Form } from '@remix-run/react';
import { prisma } from '~/db.server';

export const loader: LoaderFunction = async ({ params }) => {
  const { itemId } = params;
  
  const item = await prisma.lostItem.findUnique({
    where: { id: itemId },
    include: {
      claimRequests: true,
      history: {
        include: {
          operatorUser: true,
        },
        orderBy: {
          timestamp: 'asc',
        },
      },
      foundByUser: true,
    },
  });

  if (!item) {
    throw new Response('物品不存在', { status: 404 });
  }

  return json({ item });
};

export const action: ActionFunction = async ({ request, params }) => {
  const { itemId } = params;
  const formData = await request.formData();
  const actionType = formData.get('action') as string;

  const item = await prisma.lostItem.findUnique({
    where: { id: itemId },
    include: {
      claimRequests: true,
    },
  });

  if (!item) {
    throw new Response('物品不存在', { status: 404 });
  }

  let operatorUser;
  let actionText = '';
  let status = item.status;
  let notes = '';

  switch (actionType) {
    case 'claim': {
      const claimantName = formData.get('claimantName') as string;
      const claimantPhone = formData.get('claimantPhone') as string;
      const claimantIdCard = formData.get('claimantIdCard') as string;
      const description = formData.get('description') as string;

      operatorUser = await prisma.user.findFirst({ where: { role: 'STATION_STAFF' } });

      await prisma.claimRequest.create({
        data: {
          itemId,
          claimantName,
          claimantPhone,
          claimantIdCard,
          description,
        },
      });

      actionText = '认领申请';
      status = 'CLAIMED';
      notes = `${claimantName}提交认领申请`;
      break;
    }
    case 'verify': {
      const verified = formData.get('verified') === 'true';
      const verificationNote = formData.get('verificationNote') as string;

      operatorUser = await prisma.user.findFirst({ where: { role: 'CUSTOMER_SERVICE' } });

      await prisma.claimRequest.updateMany({
        where: { itemId },
        data: {
          verified,
          verificationNote,
          verifiedBy: operatorUser?.name,
          verifiedAt: new Date(),
        },
      });

      actionText = verified ? '材料核验通过' : '材料核验未通过';
      status = verified ? 'VERIFIED' : 'CLAIMED';
      notes = verificationNote;
      break;
    }
    case 'return': {
      const notesInput = formData.get('notes') as string;
      operatorUser = await prisma.user.findFirst({ where: { role: 'DUTY_MANAGER' } });
      actionText = '确认交还';
      status = 'RETURNED';
      notes = notesInput || '已当面交还给失主';
      break;
    }
    case 'transfer': {
      const notesInput = formData.get('notes') as string;
      operatorUser = await prisma.user.findFirst({ where: { role: 'DUTY_MANAGER' } });
      actionText = '移交处理';
      status = 'TRANSFERRED';
      notes = notesInput || '已移交至失物招领中心';
      break;
    }
    case 'archive': {
      const notesInput = formData.get('notes') as string;
      operatorUser = await prisma.user.findFirst({ where: { role: 'AUDITOR' } });
      actionText = '复核归档';
      status = 'ARCHIVED';
      notes = notesInput || '已完成归档';
      break;
    }
    default:
      throw new Error('无效操作');
  }

  await prisma.lostItem.update({
    where: { id: itemId },
    data: { status },
  });

  await prisma.historyRecord.create({
    data: {
      itemId,
      action: actionText,
      operatorName: operatorUser?.name || '系统',
      operatorUserId: operatorUser?.id || '',
      notes,
    },
  });

  return redirect(`/items/${itemId}`);
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

export default function ItemDetail() {
  const { item } = useLoaderData<typeof loader>();
  const latestClaim = item.claimRequests[item.claimRequests.length - 1];
  const isExpired = new Date(item.expiresAt) < new Date();

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2>
            {item.isValuable && <span style={{ color: '#dc3545', marginRight: 5 }}>★</span>}
            {item.name}
          </h2>
          <div style={{ marginTop: 5 }}>
            {getStatusBadge(item.status)}
            <span style={{ marginLeft: 10, color: '#666' }}>
              类别：{getCategoryLabel(item.category)}
            </span>
          </div>
        </div>
        {isExpired && item.status !== 'EXPIRED' && (
          <span className="badge badge-expired">已超期</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <h3 style={{ marginBottom: 15, color: '#2d5a87' }}>物品信息</h3>
          <div style={{ marginBottom: 10 }}>
            <strong>物品描述：</strong>{item.description}
          </div>
          <div style={{ marginBottom: 10 }}>
            <strong>拾获位置：</strong>{item.foundLocation}
          </div>
          <div style={{ marginBottom: 10 }}>
            <strong>保管柜编号：</strong>{item.lockerNumber}
          </div>
          <div style={{ marginBottom: 10 }}>
            <strong>拾获时间：</strong>{formatDate(item.foundAt)}
          </div>
          <div style={{ marginBottom: 10 }}>
            <strong>保管截止：</strong>{formatDate(item.expiresAt)}
          </div>
          <div style={{ marginBottom: 10 }}>
            <strong>登记人员：</strong>{item.foundBy}
          </div>
          {item.isValuable && (
            <div style={{ marginBottom: 10 }}>
              <strong>估算价值：</strong>¥{item.estimatedValue?.toLocaleString()}
            </div>
          )}
        </div>

        {latestClaim && (
          <div>
            <h3 style={{ marginBottom: 15, color: '#2d5a87' }}>认领人信息</h3>
            <div style={{ marginBottom: 10 }}>
              <strong>姓名：</strong>{latestClaim.claimantName}
            </div>
            <div style={{ marginBottom: 10 }}>
              <strong>联系电话：</strong>{latestClaim.claimantPhone}
            </div>
            <div style={{ marginBottom: 10 }}>
              <strong>身份证号：</strong>{latestClaim.claimantIdCard}
            </div>
            {latestClaim.relationshipProof && (
              <div style={{ marginBottom: 10 }}>
                <strong>证明材料：</strong>{latestClaim.relationshipProof}
              </div>
            )}
            <div style={{ marginBottom: 10 }}>
              <strong>认领说明：</strong>{latestClaim.description}
            </div>
            <div style={{ marginBottom: 10 }}>
              <strong>核验状态：</strong>
              {latestClaim.verified ? (
                <span className="badge badge-success">已通过</span>
              ) : (
                <span className="badge badge-danger">未通过</span>
              )}
            </div>
            {latestClaim.verificationNote && (
              <div>
                <strong>核验备注：</strong>{latestClaim.verificationNote}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 30 }}>
        <h3 style={{ marginBottom: 15, color: '#2d5a87' }}>处理历史</h3>
        <div className="timeline">
          {item.history.map((record) => (
            <div key={record.id} className="timeline-item">
              <div className="time">{formatDate(record.timestamp)}</div>
              <div className="action">{record.action}</div>
              <div className="operator">操作人：{record.operatorName}</div>
              {record.notes && <div className="notes">{record.notes}</div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid #eee' }}>
        <h3 style={{ marginBottom: 15, color: '#2d5a87' }}>操作</h3>
        
        {item.status === 'FOUND' && (
          <div className="card" style={{ marginBottom: 15 }}>
            <h4>提交认领申请</h4>
            <Form method="POST" style={{ marginTop: 15 }}>
              <input type="hidden" name="action" value="claim" />
              <div className="form-group">
                <label>认领人姓名 *</label>
                <input type="text" name="claimantName" required />
              </div>
              <div className="form-group">
                <label>联系电话 *</label>
                <input type="tel" name="claimantPhone" required />
              </div>
              <div className="form-group">
                <label>身份证号 *</label>
                <input type="text" name="claimantIdCard" required />
              </div>
              <div className="form-group">
                <label>关系证明（如有）</label>
                <input type="text" name="relationshipProof" />
              </div>
              <div className="form-group">
                <label>物品描述 *</label>
                <textarea name="description" required />
              </div>
              <button type="submit" className="btn btn-primary">提交认领申请</button>
            </Form>
          </div>
        )}

        {item.status === 'CLAIMED' && (
          <div className="card" style={{ marginBottom: 15 }}>
            <h4>客服人员核验认领材料</h4>
            <Form method="POST" style={{ marginTop: 15 }}>
              <input type="hidden" name="action" value="verify" />
              <div className="form-group">
                <label>核验结果 *</label>
                <div>
                  <label style={{ marginRight: 20 }}>
                    <input type="radio" name="verified" value="true" defaultChecked /> 通过
                  </label>
                  <label>
                    <input type="radio" name="verified" value="false" /> 未通过
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label>核验备注</label>
                <textarea name="verificationNote" />
              </div>
              <button type="submit" className="btn btn-primary">确认核验</button>
            </Form>
          </div>
        )}

        {item.status === 'VERIFIED' && (
          <div className="card" style={{ marginBottom: 15 }}>
            <h4>值班站长确认交还</h4>
            <Form method="POST">
              <input type="hidden" name="action" value="return" />
              <div className="form-group">
                <label>备注</label>
                <textarea name="notes" />
              </div>
              <button type="submit" className="btn btn-success">确认交还</button>
            </Form>
          </div>
        )}

        {item.status === 'VERIFIED' && (
          <div className="card" style={{ marginBottom: 15 }}>
            <h4>值班站长移交处理（超期或特殊情况）</h4>
            <Form method="POST">
              <input type="hidden" name="action" value="transfer" />
              <div className="form-group">
                <label>备注</label>
                <textarea name="notes" />
              </div>
              <button type="submit" className="btn btn-warning">移交处理</button>
            </Form>
          </div>
        )}

        {item.status === 'RETURNED' && (
          <div className="card" style={{ marginBottom: 15 }}>
            <h4>审计员复核归档</h4>
            <Form method="POST">
              <input type="hidden" name="action" value="archive" />
              <div className="form-group">
                <label>归档备注</label>
                <textarea name="notes" />
              </div>
              <button type="submit" className="btn btn-primary">复核归档</button>
            </Form>
          </div>
        )}

        {item.status === 'CLAIMED' && latestClaim && !latestClaim.verified && (
          <div className="card" style={{ backgroundColor: '#fff3cd', borderColor: '#ffeeba' }}>
            <h4 style={{ color: '#856404' }}>⚠️ 认领信息不符</h4>
            <p style={{ color: '#856404' }}>由于认领信息与物品描述不符，禁止交还物品。请联系认领人核实信息。</p>
          </div>
        )}
      </div>
    </div>
  );
}
