from django.db import migrations
from datetime import datetime, timedelta

def create_sample_data(apps, schema_editor):
    Site = apps.get_model('appeal', 'Site')
    Rider = apps.get_model('appeal', 'Rider')
    Order = apps.get_model('appeal', 'Order')
    PenaltyRule = apps.get_model('appeal', 'PenaltyRule')
    Penalty = apps.get_model('appeal', 'Penalty')
    Appeal = apps.get_model('appeal', 'Appeal')
    AppealHistory = apps.get_model('appeal', 'AppealHistory')
    Trajectory = apps.get_model('appeal', 'Trajectory')
    ChatEvidence = apps.get_model('appeal', 'ChatEvidence')
    User = apps.get_model('auth', 'User')

    manager_user = User.objects.create_user(username='manager', password='123456', email='manager@example.com')
    station_master = User.objects.create_user(username='station_master', password='123456', email='master@example.com')
    arbitrator = User.objects.create_user(username='arbitrator', password='123456', email='arbitrator@example.com')
    rider_user1 = User.objects.create_user(username='rider_zhang', password='123456', email='rider1@example.com')
    rider_user2 = User.objects.create_user(username='rider_li', password='123456', email='rider2@example.com')
    rider_user3 = User.objects.create_user(username='rider_wang', password='123456', email='rider3@example.com')

    site1 = Site.objects.create(name='北京朝阳区站点', address='北京市朝阳区xxx路xxx号', manager=station_master)
    site2 = Site.objects.create(name='北京海淀区站点', address='北京市海淀区xxx路xxx号', manager=station_master)

    rider1 = Rider.objects.create(user=rider_user1, site=site1, phone='13800138001', id_card='110101199001011234', join_date='2020-01-01')
    rider2 = Rider.objects.create(user=rider_user2, site=site1, phone='13800138002', id_card='110101199001011235', join_date='2021-03-15')
    rider3 = Rider.objects.create(user=rider_user3, site=site2, phone='13800138003', id_card='110101199001011236', join_date='2019-06-01')

    timeout_rule = PenaltyRule.objects.create(name='超时配送扣罚', rule_type='timeout', description='订单实际送达时间超过预计送达时间30分钟以上', base_amount=50, min_amount=20, max_amount=200)
    location_rule = PenaltyRule.objects.create(name='定位漂移扣罚', rule_type='location_drift', description='骑手定位数据与实际配送路线偏差超过500米', base_amount=30, min_amount=10, max_amount=100)
    complaint_rule = PenaltyRule.objects.create(name='客户恶意投诉扣罚', rule_type='customer_complaint', description='客户投诉骑手服务态度或配送问题', base_amount=100, min_amount=50, max_amount=500)

    now = datetime.now()
    
    order1 = Order.objects.create(
        order_no='DD20240115001',
        rider=rider1,
        site=site1,
        customer_name='张三',
        customer_phone='13900139001',
        address='北京市朝阳区xx小区1号楼',
        create_time=now - timedelta(hours=2),
        expected_delivery_time=now - timedelta(hours=1),
        actual_delivery_time=now - timedelta(minutes=30),
        status='completed',
        amount=35.00
    )

    penalty1 = Penalty.objects.create(
        order=order1,
        rule=timeout_rule,
        rider=rider1,
        site=site1,
        amount=50.00,
        description='订单超时配送，超出预计时间30分钟',
        created_by=manager_user,
        created_at=now - timedelta(minutes=25),
        status='appealing'
    )

    appeal1 = Appeal.objects.create(
        penalty=penalty1,
        rider=rider1,
        reason='当时遇到严重堵车，已经提前告知客户并获得理解',
        status='approved',
        result='revoked',
        created_at=now - timedelta(minutes=20)
    )

    AppealHistory.objects.create(appeal=appeal1, action='create', operator=manager_user, comment='创建超时配送扣罚')
    AppealHistory.objects.create(appeal=appeal1, action='appeal', operator=rider_user1, comment='骑手提交申诉，说明堵车情况')
    AppealHistory.objects.create(appeal=appeal1, action='first_review_pass', operator=station_master, comment='初审通过，证据充分')
    AppealHistory.objects.create(appeal=appeal1, action='arbitration_pass', operator=arbitrator, comment='仲裁通过，撤销扣罚')

    order2 = Order.objects.create(
        order_no='DD20240115002',
        rider=rider2,
        site=site1,
        customer_name='李四',
        customer_phone='13900139002',
        address='北京市朝阳区xx大厦A座',
        create_time=now - timedelta(hours=3),
        expected_delivery_time=now - timedelta(hours=2),
        actual_delivery_time=now - timedelta(hours=1, minutes=45),
        status='completed',
        amount=42.50
    )

    penalty2 = Penalty.objects.create(
        order=order2,
        rule=timeout_rule,
        rider=rider2,
        site=site1,
        amount=80.00,
        description='订单超时配送，超出预计时间15分钟',
        created_by=manager_user,
        created_at=now - timedelta(hours=1, minutes=30),
        status='appealing'
    )

    appeal2 = Appeal.objects.create(
        penalty=penalty2,
        rider=rider2,
        reason='小区门禁严格，等待时间较长',
        status='arbitration',
        result='pending',
        created_at=now - timedelta(hours=1)
    )

    AppealHistory.objects.create(appeal=appeal2, action='create', operator=manager_user, comment='创建超时配送扣罚')
    AppealHistory.objects.create(appeal=appeal2, action='appeal', operator=rider_user2, comment='骑手提交申诉')
    AppealHistory.objects.create(appeal=appeal2, action='first_review_pass', operator=station_master, comment='初审通过')

    order3 = Order.objects.create(
        order_no='DD20240115003',
        rider=rider3,
        site=site2,
        customer_name='王五',
        customer_phone='13900139003',
        address='北京市海淀区xx科技园B座',
        create_time=now - timedelta(hours=4),
        expected_delivery_time=now - timedelta(hours=3),
        actual_delivery_time=now - timedelta(hours=2, minutes=50),
        status='completed',
        amount=28.00
    )

    penalty3 = Penalty.objects.create(
        order=order3,
        rule=location_rule,
        rider=rider3,
        site=site2,
        amount=30.00,
        description='骑手定位数据显示在配送途中出现明显漂移，偏离配送路线约800米',
        created_by=manager_user,
        created_at=now - timedelta(hours=2),
        status='appealing'
    )

    appeal3 = Appeal.objects.create(
        penalty=penalty3,
        rider=rider3,
        reason='当时手机信号不稳定，导致定位不准确，实际一直在正常配送',
        status='supplement',
        result='supplement',
        created_at=now - timedelta(hours=1, minutes=30)
    )

    AppealHistory.objects.create(appeal=appeal3, action='create', operator=manager_user, comment='创建定位漂移扣罚')
    AppealHistory.objects.create(appeal=appeal3, action='appeal', operator=rider_user3, comment='骑手提交申诉')
    AppealHistory.objects.create(appeal=appeal3, action='first_review_reject', operator=station_master, comment='初审驳回，证据不足')
    AppealHistory.objects.create(appeal=appeal3, action='supplement', operator=station_master, comment='要求补充轨迹证据')

    Trajectory.objects.create(rider=rider3, order=order3, latitude=39.9842, longitude=116.4074, timestamp=now - timedelta(hours=3, minutes=30), accuracy=10.0)
    Trajectory.objects.create(rider=rider3, order=order3, latitude=39.9845, longitude=116.4080, timestamp=now - timedelta(hours=3, minutes=20), accuracy=15.0)
    Trajectory.objects.create(rider=rider3, order=order3, latitude=39.9900, longitude=116.4100, timestamp=now - timedelta(hours=3, minutes=10), accuracy=500.0, is_recalculated=False)
    Trajectory.objects.create(rider=rider3, order=order3, latitude=39.9850, longitude=116.4085, timestamp=now - timedelta(hours=3), accuracy=12.0)

    order4 = Order.objects.create(
        order_no='DD20240115004',
        rider=rider1,
        site=site1,
        customer_name='赵六',
        customer_phone='13900139004',
        address='北京市朝阳区xx购物中心',
        create_time=now - timedelta(hours=5),
        expected_delivery_time=now - timedelta(hours=4),
        actual_delivery_time=now - timedelta(hours=3, minutes=55),
        status='completed',
        amount=68.00
    )

    penalty4 = Penalty.objects.create(
        order=order4,
        rule=complaint_rule,
        rider=rider1,
        site=site1,
        amount=100.00,
        description='客户投诉骑手态度恶劣，服务不佳',
        created_by=manager_user,
        created_at=now - timedelta(hours=3, minutes=30),
        status='appealing'
    )

    appeal4 = Appeal.objects.create(
        penalty=penalty4,
        rider=rider1,
        reason='客户恶意投诉，当时客户要求提前送达，但商家出餐慢无法满足，客户不满',
        status='approved',
        result='revoked',
        created_at=now - timedelta(hours=3)
    )

    AppealHistory.objects.create(appeal=appeal4, action='create', operator=manager_user, comment='创建客户投诉扣罚')
    AppealHistory.objects.create(appeal=appeal4, action='appeal', operator=rider_user1, comment='骑手提交申诉')
    AppealHistory.objects.create(appeal=appeal4, action='first_review_pass', operator=station_master, comment='初审通过')
    AppealHistory.objects.create(appeal=appeal4, action='arbitration_pass', operator=arbitrator, comment='经查实，客户存在恶意投诉行为，撤销扣罚')

    ChatEvidence.objects.create(appeal=appeal4, sender='客户-赵六', content='你们骑手怎么这么慢？我等了半小时了！', timestamp=now - timedelta(hours=4, minutes=30), direction='in')
    ChatEvidence.objects.create(appeal=appeal4, sender='骑手-张', content='抱歉，商家出餐有点慢，我拿到餐马上给您送过去', timestamp=now - timedelta(hours=4, minutes=25), direction='out')
    ChatEvidence.objects.create(appeal=appeal4, sender='客户-赵六', content='不行，我现在就要！不然我投诉你！', timestamp=now - timedelta(hours=4, minutes=20), direction='in')
    ChatEvidence.objects.create(appeal=appeal4, sender='骑手-张', content='请理解一下，我也想尽快送达', timestamp=now - timedelta(hours=4, minutes=15), direction='out')

    order5 = Order.objects.create(
        order_no='DD20240115005',
        rider=rider2,
        site=site1,
        customer_name='孙七',
        customer_phone='13900139005',
        address='北京市朝阳区xx小区2号楼',
        create_time=now - timedelta(hours=1),
        expected_delivery_time=now + timedelta(minutes=30),
        actual_delivery_time=None,
        status='delivering',
        amount=25.00
    )

    penalty5 = Penalty.objects.create(
        order=order5,
        rule=location_rule,
        rider=rider2,
        site=site1,
        amount=50.00,
        description='骑手在配送过程中定位出现异常漂移，系统已自动触发扣罚',
        created_by=manager_user,
        created_at=now - timedelta(minutes=30),
        status='pending'
    )

    Trajectory.objects.create(rider=rider2, order=order5, latitude=39.9780, longitude=116.4120, timestamp=now - timedelta(minutes=40), accuracy=8.0)
    Trajectory.objects.create(rider=rider2, order=order5, latitude=39.9800, longitude=116.4150, timestamp=now - timedelta(minutes=30), accuracy=10.0)
    Trajectory.objects.create(rider=rider2, order=order5, latitude=39.9950, longitude=116.4300, timestamp=now - timedelta(minutes=20), accuracy=600.0, is_recalculated=False)

class Migration(migrations.Migration):
    dependencies = [
        ('appeal', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_sample_data),
    ]