from django.db import migrations
from django.contrib.auth.hashers import make_password
from decimal import Decimal
from datetime import date, timedelta


def seed_data(apps, schema_editor):
    User = apps.get_model('meter_review', 'User')
    District = apps.get_model('meter_review', 'District')
    Customer = apps.get_model('meter_review', 'Customer')
    AnomalyType = apps.get_model('meter_review', 'AnomalyType')
    MeterReading = apps.get_model('meter_review', 'MeterReading')

    admin_user, _ = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@example.com',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True,
            'password': make_password('admin123')
        }
    )

    reader_user, _ = User.objects.get_or_create(
        username='reader',
        defaults={
            'email': 'reader@example.com',
            'role': 'reader',
            'is_staff': True,
            'password': make_password('reader123')
        }
    )

    reviewer_user, _ = User.objects.get_or_create(
        username='reviewer',
        defaults={
            'email': 'reviewer@example.com',
            'role': 'reviewer',
            'is_staff': True,
            'password': make_password('reviewer123')
        }
    )

    district1, _ = District.objects.get_or_create(
        code='D001',
        defaults={
            'name': '朝阳区',
            'manager': reader_user
        }
    )

    district2, _ = District.objects.get_or_create(
        code='D002',
        defaults={
            'name': '海淀区',
            'manager': reader_user
        }
    )

    district3, _ = District.objects.get_or_create(
        code='D003',
        defaults={
            'name': '西城区',
            'manager': reader_user
        }
    )

    district4, _ = District.objects.get_or_create(
        code='D004',
        defaults={
            'name': '东城区',
            'manager': reader_user
        }
    )

    anomaly_normal, _ = AnomalyType.objects.get_or_create(
        code='A001',
        defaults={
            'name': '正常读数',
            'description': '读数正常，无异常',
            'block_adjustment': False,
            'sort_order': 1
        }
    )

    anomaly_spike, _ = AnomalyType.objects.get_or_create(
        code='A002',
        defaults={
            'name': '读数突增',
            'description': '本期读数较上期异常增长，可能存在漏水或抄表错误',
            'block_adjustment': False,
            'check_fields': '本期读数,上期读数,用水量',
            'sort_order': 2
        }
    )

    anomaly_mismatch, _ = AnomalyType.objects.get_or_create(
        code='A003',
        defaults={
            'name': '表号不匹配',
            'description': '抄表表号与系统登记表号不一致，需核对用户信息和水表编号',
            'block_adjustment': True,
            'check_fields': '水表编号,用户编号,用户姓名,用户地址',
            'sort_order': 3
        }
    )

    anomaly_complaint, _ = AnomalyType.objects.get_or_create(
        code='A004',
        defaults={
            'name': '用户申诉',
            'description': '用户对抄表结果提出异议，需现场核实',
            'block_adjustment': False,
            'check_fields': '本期读数,用水量,费用',
            'sort_order': 4
        }
    )

    customers_data = [
        {'no': 'C0001', 'name': '张三', 'phone': '13800138001', 'address': '朝阳区建国路88号院1号楼101', 'meter': 'WM0001', 'district': district1, 'price': Decimal('5.00')},
        {'no': 'C0002', 'name': '李四', 'phone': '13800138002', 'address': '朝阳区建国路88号院1号楼102', 'meter': 'WM0002', 'district': district1, 'price': Decimal('5.00')},
        {'no': 'C0003', 'name': '王五', 'phone': '13800138003', 'address': '海淀区中关村大街1号2号楼201', 'meter': 'WM0003', 'district': district2, 'price': Decimal('5.00')},
        {'no': 'C0004', 'name': '赵六', 'phone': '13800138004', 'address': '海淀区中关村大街1号2号楼202', 'meter': 'WM0004', 'district': district2, 'price': Decimal('5.00')},
        {'no': 'C0005', 'name': '孙七', 'phone': '13800138005', 'address': '西城区金融街15号3号楼301', 'meter': 'WM0005', 'district': district3, 'price': Decimal('5.00')},
        {'no': 'C0006', 'name': '周八', 'phone': '13800138006', 'address': '西城区金融街15号3号楼302', 'meter': 'WM0006', 'district': district3, 'price': Decimal('5.00')},
        {'no': 'C0007', 'name': '吴九', 'phone': '13800138007', 'address': '东城区王府井大街88号4号楼401', 'meter': 'WM0007', 'district': district4, 'price': Decimal('5.00')},
        {'no': 'C0008', 'name': '郑十', 'phone': '13800138008', 'address': '东城区王府井大街88号4号楼402', 'meter': 'WM0008', 'district': district4, 'price': Decimal('5.00')},
        {'no': 'C0009', 'name': '陈十一', 'phone': '13800138009', 'address': '朝阳区建国路88号院5号楼501', 'meter': 'WM0009', 'district': district1, 'price': Decimal('5.00')},
        {'no': 'C0010', 'name': '刘十二', 'phone': '13800138010', 'address': '海淀区中关村大街1号6号楼601', 'meter': 'WM0010', 'district': district2, 'price': Decimal('5.00')},
    ]

    customers = []
    for data in customers_data:
        customer, _ = Customer.objects.get_or_create(
            customer_no=data['no'],
            defaults={
                'name': data['name'],
                'phone': data['phone'],
                'address': data['address'],
                'meter_no': data['meter'],
                'district': data['district'],
                'water_price': data['price'],
                'is_active': True
            }
        )
        customers.append(customer)

    today = date.today()
    readings_data = [
        {
            'customer': customers[0],
            'reading_date': today - timedelta(days=1),
            'last': Decimal('100.00'),
            'current': Decimal('110.00'),
            'anomaly': anomaly_normal,
            'anomaly_detail': '',
            'status': 'pending',
            'owner': None,
            'assigned': None
        },
        {
            'customer': customers[1],
            'reading_date': today - timedelta(days=2),
            'last': Decimal('200.00'),
            'current': Decimal('350.00'),
            'anomaly': anomaly_spike,
            'anomaly_detail': '本期用水量异常，较上月增长150吨，超出正常用水范围3倍。疑似存在管道漏水或抄表错误。',
            'status': 'reading',
            'owner': reader_user,
            'assigned': reader_user
        },
        {
            'customer': customers[2],
            'reading_date': today - timedelta(days=3),
            'last': Decimal('150.00'),
            'current': Decimal('160.00'),
            'anomaly': anomaly_mismatch,
            'anomaly_detail': '现场抄表表号为WM9999，与系统登记表号WM0003不一致。需核对用户身份信息和水表安装位置。',
            'status': 'reviewing',
            'owner': None,
            'assigned': reader_user
        },
        {
            'customer': customers[3],
            'reading_date': today - timedelta(days=4),
            'last': Decimal('180.00'),
            'current': Decimal('200.00'),
            'anomaly': anomaly_complaint,
            'anomaly_detail': '用户来电申诉，认为本期用水量过高，与实际用水情况不符。用户声称本月家中无人，用水量不应超过5吨。',
            'status': 'pending',
            'owner': None,
            'assigned': None
        },
        {
            'customer': customers[4],
            'reading_date': today - timedelta(days=5),
            'last': Decimal('300.00'),
            'current': Decimal('310.00'),
            'anomaly': anomaly_normal,
            'anomaly_detail': '',
            'status': 'adjusted',
            'owner': reviewer_user,
            'assigned': reader_user,
            'adjusted_reading': Decimal('308.00'),
            'adjusted_usage': Decimal('8.00'),
            'adjusted_fee': Decimal('40.00'),
            'adjustment_basis': '用户现场说明表针指示有误，经复核确认，调整后读数为308.00。'
        },
        {
            'customer': customers[5],
            'reading_date': today - timedelta(days=6),
            'last': Decimal('250.00'),
            'current': Decimal('265.00'),
            'anomaly': anomaly_normal,
            'anomaly_detail': '',
            'status': 'archived',
            'owner': reviewer_user,
            'assigned': reader_user
        },
        {
            'customer': customers[6],
            'reading_date': today - timedelta(days=7),
            'last': Decimal('120.00'),
            'current': Decimal('280.00'),
            'anomaly': anomaly_spike,
            'anomaly_detail': '用水量异常增长160吨，经初步排查为用户家中马桶漏水导致。',
            'status': 'returned',
            'owner': reader_user,
            'assigned': reader_user,
            'rework_count': 1
        },
        {
            'customer': customers[7],
            'reading_date': today - timedelta(days=8),
            'last': Decimal('90.00'),
            'current': Decimal('95.00'),
            'anomaly': anomaly_normal,
            'anomaly_detail': '',
            'status': 'pending',
            'owner': None,
            'assigned': None
        },
        {
            'customer': customers[8],
            'reading_date': today - timedelta(days=9),
            'last': Decimal('500.00'),
            'current': Decimal('520.00'),
            'anomaly': anomaly_complaint,
            'anomaly_detail': '用户认为水费计算有误，要求重新核实用水量和费用。',
            'status': 'reading',
            'owner': reader_user,
            'assigned': reader_user
        },
        {
            'customer': customers[9],
            'reading_date': today - timedelta(days=10),
            'last': Decimal('400.00'),
            'current': Decimal('415.00'),
            'anomaly': anomaly_mismatch,
            'anomaly_detail': '抄表时发现水表编号与系统记录不符，现场表号为WM8888，系统记录为WM0010。',
            'status': 'pending',
            'owner': None,
            'assigned': None
        },
        {
            'customer': customers[0],
            'reading_date': today - timedelta(days=35),
            'last': Decimal('90.00'),
            'current': Decimal('100.00'),
            'anomaly': anomaly_normal,
            'anomaly_detail': '',
            'status': 'archived',
            'owner': reviewer_user,
            'assigned': reader_user
        },
        {
            'customer': customers[1],
            'reading_date': today - timedelta(days=36),
            'last': Decimal('190.00'),
            'current': Decimal('200.00'),
            'anomaly': anomaly_normal,
            'anomaly_detail': '',
            'status': 'archived',
            'owner': reviewer_user,
            'assigned': reader_user
        },
    ]

    for data in readings_data:
        usage = data['current'] - data['last']
        original_fee = usage * data['customer'].water_price

        reading, _ = MeterReading.objects.get_or_create(
            customer=data['customer'],
            reading_date=data['reading_date'],
            defaults={
                'last_reading': data['last'],
                'current_reading': data['current'],
                'adjusted_reading': data.get('adjusted_reading'),
                'usage': usage,
                'adjusted_usage': data.get('adjusted_usage'),
                'original_fee': original_fee,
                'adjusted_fee': data.get('adjusted_fee'),
                'anomaly_type': data['anomaly'],
                'anomaly_detail': data['anomaly_detail'],
                'status': data['status'],
                'current_owner': data['owner'],
                'assigned_reader': data['assigned'],
                'rework_count': data.get('rework_count', 0),
                'adjustment_basis': data.get('adjustment_basis', '')
            }
        )


def reverse_seed_data(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('meter_review', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_data, reverse_seed_data),
    ]
