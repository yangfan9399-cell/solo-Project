import { ActionFunction, redirect } from '@remix-run/node';
import { Form } from '@remix-run/react';
import { prisma } from '~/db.server';

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const description = formData.get('description') as string;
  const foundLocation = formData.get('foundLocation') as string;
  const lockerNumber = formData.get('lockerNumber') as string;
  const isValuable = formData.get('isValuable') === 'on';
  const estimatedValue = parseFloat(formData.get('estimatedValue') as string) || undefined;

  const foundByUser = await prisma.user.findFirst({
    where: { role: 'STATION_STAFF' },
  });

  if (!foundByUser) {
    throw new Error('未找到站务员用户');
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 10);

  const item = await prisma.lostItem.create({
    data: {
      name,
      category,
      description,
      foundLocation,
      lockerNumber,
      isValuable,
      estimatedValue,
      expiresAt,
      foundBy: foundByUser.name,
      foundByUserId: foundByUser.id,
    },
  });

  await prisma.historyRecord.create({
    data: {
      itemId: item.id,
      action: '拾获登记',
      operatorName: foundByUser.name,
      operatorUserId: foundByUser.id,
      notes: `站务员${foundByUser.name}在${foundLocation}拾获${name}`,
    },
  });

  return redirect('/');
};

function getCategoryOptions() {
  return [
    { value: 'ELECTRONICS', label: '电子产品' },
    { value: 'DOCUMENTS', label: '证件文件' },
    { value: 'BAGS', label: '箱包' },
    { value: 'CLOTHING', label: '衣物' },
    { value: 'JEWELRY', label: '首饰' },
    { value: 'WALLET', label: '钱包' },
    { value: 'OTHER', label: '其他' },
  ];
}

export default function Register() {
  return (
    <div className="card">
      <h2>登记遗失物品</h2>
      <Form method="POST" style={{ marginTop: 20 }}>
        <div className="form-group">
          <label>物品名称 *</label>
          <input type="text" name="name" required />
        </div>

        <div className="form-group">
          <label>物品类别 *</label>
          <select name="category" required>
            <option value="">请选择类别</option>
            {getCategoryOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>物品描述 *</label>
          <textarea name="description" required />
        </div>

        <div className="form-group">
          <label>拾获位置 *</label>
          <input type="text" name="foundLocation" required />
        </div>

        <div className="form-group">
          <label>保管柜编号 *</label>
          <input type="text" name="lockerNumber" required />
        </div>

        <div className="form-group">
          <label>
            <input type="checkbox" name="isValuable" /> 贵重物品
          </label>
        </div>

        <div className="form-group">
          <label>估算价值（元）</label>
          <input type="number" name="estimatedValue" />
        </div>

        <button type="submit" className="btn btn-primary">
          提交登记
        </button>
      </Form>
    </div>
  );
}
