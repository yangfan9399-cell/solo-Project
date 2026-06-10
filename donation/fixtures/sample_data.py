import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'donation_platform.settings')
django.setup()

from datetime import date, timedelta
from donation.models import Donor, MaterialCategory, Material, Batch, Recipient, Project, DistributionPlan, Receipt, HistoryNode
from django.contrib.auth.models import User

def create_sample_data():
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    admin = User.objects.get(username='admin')

    donor1 = Donor.objects.create(name='爱心企业A', contact='张经理', phone='13800138001', address='北京市朝阳区xxx路')
    donor2 = Donor.objects.create(name='公益基金会B', contact='李主任', phone='13800138002', address='上海市浦东新区xxx号')
    donor3 = Donor.objects.create(name='个人捐赠者C', contact='王先生', phone='13800138003', address='广州市天河区xxx街')

    category1 = MaterialCategory.objects.create(name='食品')
    category2 = MaterialCategory.objects.create(name='日用品')
    category3 = MaterialCategory.objects.create(name='医疗用品')

    material1 = Material.objects.create(name='大米', category=category1, unit='袋', specification='25kg/袋')
    material2 = Material.objects.create(name='食用油', category=category1, unit='桶', specification='5L/桶')
    material3 = Material.objects.create(name='口罩', category=category3, unit='盒', specification='50只/盒')
    material4 = Material.objects.create(name='消毒液', category=category3, unit='瓶', specification='500ml/瓶')
    material5 = Material.objects.create(name='毛巾', category=category2, unit='条')
    material6 = Material.objects.create(name='棉被', category=category2, unit='床')

    project1 = Project.objects.create(name='灾区援助项目', description='为地震灾区提供物资援助', start_date=date(2024, 1, 1), status='active')
    project2 = Project.objects.create(name='贫困地区帮扶', description='为贫困地区学校提供物资', start_date=date(2024, 3, 1), status='active')
    project3 = Project.objects.create(name='疫情防控支援', description='为疫情防控提供医疗物资', start_date=date(2024, 1, 1), end_date=date(2024, 6, 30), status='completed')

    recipient1 = Recipient.objects.create(name='XX镇政府', contact='刘书记', phone='13900139001', address='XX省XX市XX镇')
    recipient2 = Recipient.objects.create(name='XX小学', contact='王校长', phone='13900139002', address='XX省XX县XX乡')
    recipient3 = Recipient.objects.create(name='XX医院', contact='陈院长', phone='13900139003', address='XX市XX区XX路')
    recipient4 = Recipient.objects.create(name='XX社区居委会', contact='', phone='', address='')

    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    sixty_days_ago = today - timedelta(days=60)
    one_month_later = today + timedelta(days=30)
    two_months_later = today + timedelta(days=60)

    batch1 = Batch.objects.create(
        donor=donor1,
        material=material1,
        quantity=100,
        received_quantity=100,
        expire_date=two_months_later,
        batch_number='B202401001',
        status='in_stock',
        storage_location='A区-1号仓库',
        received_at=sixty_days_ago,
        operator=admin
    )

    batch2 = Batch.objects.create(
        donor=donor2,
        material=material2,
        quantity=50,
        received_quantity=50,
        expire_date=one_month_later,
        batch_number='B202401002',
        status='in_stock',
        storage_location='A区-2号仓库',
        received_at=thirty_days_ago,
        operator=admin
    )

    batch3 = Batch.objects.create(
        donor=donor3,
        material=material3,
        quantity=200,
        received_quantity=200,
        expire_date=sixty_days_ago,
        batch_number='B202401003',
        status='in_stock',
        storage_location='B区-1号仓库',
        received_at=date(2024, 1, 15),
        operator=admin
    )

    batch4 = Batch.objects.create(
        donor=donor1,
        material=material4,
        quantity=150,
        received_quantity=150,
        expire_date=two_months_later,
        batch_number='B202401004',
        status='in_stock',
        storage_location='B区-2号仓库',
        received_at=thirty_days_ago,
        operator=admin
    )

    batch5 = Batch.objects.create(
        donor=donor2,
        material=material5,
        quantity=300,
        received_quantity=300,
        expire_date=one_month_later,
        batch_number='B202401005',
        status='in_stock',
        storage_location='C区-1号仓库',
        received_at=date(2024, 2, 1),
        operator=admin
    )

    batch6 = Batch.objects.create(
        donor=donor3,
        material=material6,
        quantity=50,
        received_quantity=50,
        expire_date=today - timedelta(days=1),
        batch_number='B202401006',
        status='in_stock',
        storage_location='C区-2号仓库',
        received_at=date(2024, 1, 1),
        operator=admin
    )

    dist1 = DistributionPlan.objects.create(
        batch=batch1,
        project=project1,
        recipient=recipient1,
        quantity=50,
        planned_date=date(2024, 3, 1),
        status='archived',
        actual_distributed_date=date(2024, 3, 2),
        operator=admin
    )
    receipt1 = Receipt.objects.create(
        distribution=dist1,
        quantity_received=50,
        signed_by='刘书记',
        notes='正常签收'
    )

    dist2 = DistributionPlan.objects.create(
        batch=batch1,
        project=project2,
        recipient=recipient2,
        quantity=30,
        planned_date=date(2024, 3, 15),
        status='received',
        actual_distributed_date=date(2024, 3, 16),
        operator=admin
    )
    receipt2 = Receipt.objects.create(
        distribution=dist2,
        quantity_received=28,
        signed_by='王校长',
        notes='收到28袋，2袋破损'
    )

    dist3 = DistributionPlan.objects.create(
        batch=batch2,
        project=project1,
        recipient=recipient1,
        quantity=20,
        planned_date=date(2024, 3, 20),
        status='distributed',
        actual_distributed_date=date(2024, 3, 21),
        operator=admin
    )

    dist4 = DistributionPlan.objects.create(
        batch=batch4,
        project=project3,
        recipient=recipient4,
        quantity=100,
        planned_date=date(2024, 4, 1),
        status='approved',
        operator=admin
    )

    dist5 = DistributionPlan.objects.create(
        batch=batch5,
        project=project2,
        recipient=recipient2,
        quantity=100,
        planned_date=date(2024, 4, 10),
        status='draft',
        operator=admin
    )

    batch1.distributed_quantity = 80
    batch1.save()
    batch2.distributed_quantity = 20
    batch2.save()
    batch4.distributed_quantity = 100
    batch4.save()
    batch5.distributed_quantity = 100
    batch5.save()

    HistoryNode.objects.create(batch=batch1, node_type='receive', operator=admin, description=f'入库 {batch1.received_quantity} 袋大米')
    HistoryNode.objects.create(batch=batch1, distribution=dist1, node_type='distribute', operator=admin, description=f'分配50袋大米到灾区援助项目')
    HistoryNode.objects.create(batch=batch1, distribution=dist2, node_type='distribute', operator=admin, description=f'分配30袋大米到贫困地区帮扶项目')

    HistoryNode.objects.create(batch=batch2, node_type='receive', operator=admin, description=f'入库 {batch2.received_quantity} 桶食用油')
    HistoryNode.objects.create(batch=batch2, distribution=dist3, node_type='distribute', operator=admin, description=f'分配20桶食用油到灾区援助项目')

    HistoryNode.objects.create(batch=batch4, node_type='receive', operator=admin, description=f'入库 {batch4.received_quantity} 瓶消毒液')
    HistoryNode.objects.create(batch=batch4, distribution=dist4, node_type='distribute', operator=admin, description=f'创建分配计划，分配100瓶消毒液')
    HistoryNode.objects.create(batch=batch4, distribution=dist4, node_type='audit', operator=admin, description='分配计划已批准')

    print("样本数据创建完成！")

if __name__ == '__main__':
    create_sample_data()