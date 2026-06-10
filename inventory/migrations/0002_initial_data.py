from django.db import migrations
from datetime import date, timedelta
from django.utils import timezone

def create_initial_data(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    College = apps.get_model('inventory', 'College')
    ConsumableCategory = apps.get_model('inventory', 'ConsumableCategory')
    Consumable = apps.get_model('inventory', 'Consumable')
    Batch = apps.get_model('inventory', 'Batch')
    ResearchGroup = apps.get_model('inventory', 'ResearchGroup')
    UserProfile = apps.get_model('inventory', 'UserProfile')
    Application = apps.get_model('inventory', 'Application')
    ApplicationHistory = apps.get_model('inventory', 'ApplicationHistory')

    colleges = [
        ('engineering', '工程学院'),
        ('science', '理学院'),
        ('medicine', '医学院'),
        ('business', '商学院'),
        ('arts', '文学院'),
    ]
    college_objs = {}
    for code, name in colleges:
        college = College.objects.create(name=code)
        college_objs[code] = college

    categories = [
        ('chemical', '化学试剂'),
        ('glass', '玻璃器皿'),
        ('instrument', '仪器设备'),
        ('biological', '生物材料'),
        ('safety', '安全防护'),
        ('other', '其他'),
    ]
    category_objs = {}
    for code, name in categories:
        cat = ConsumableCategory.objects.create(name=code)
        category_objs[code] = cat

    consumables = [
        ('普通玻璃烧杯', 'glass', 'I', '个', 20, 100, False),
        ('移液枪头', 'other', 'I', '盒', 10, 50, False),
        ('无水乙醇', 'chemical', 'II', '瓶', 10, 50, False),
        ('浓硫酸', 'chemical', 'IV', '瓶', 5, 20, True),
        ('PCR试剂盒', 'biological', 'II', '盒', 5, 20, False),
        ('离心机', 'instrument', 'I', '台', 2, 5, False),
        ('防护手套', 'safety', 'I', '盒', 20, 100, False),
        ('甲醛溶液', 'chemical', 'IV', '瓶', 5, 20, True),
        ('培养皿', 'glass', 'I', '盒', 20, 100, False),
        ('液氮罐', 'instrument', 'III', '个', 2, 10, True),
    ]
    consumable_objs = {}
    for name, cat_code, danger, unit, min_stock, max_stock, requires_qual in consumables:
        consumable = Consumable.objects.create(
            name=name,
            category=category_objs[cat_code],
            danger_level=danger,
            unit=unit,
            min_stock=min_stock,
            max_stock=max_stock,
            requires_qualification=requires_qual
        )
        consumable_objs[name] = consumable

    today = date.today()
    batches = [
        ('普通玻璃烧杯', 'B2024001', 50, today + timedelta(days=365), 'A区-101'),
        ('普通玻璃烧杯', 'B2024002', 5, today + timedelta(days=30), 'A区-101'),
        ('移液枪头', 'B2024003', 30, today + timedelta(days=180), 'A区-102'),
        ('无水乙醇', 'B2024004', 25, today + timedelta(days=180), 'B区-201'),
        ('浓硫酸', 'B2024005', 3, today + timedelta(days=90), 'C区-危化库'),
        ('PCR试剂盒', 'B2024006', 8, today + timedelta(days=60), 'B区-202'),
        ('离心机', 'B2024007', 3, today + timedelta(days=730), 'C区-301'),
        ('防护手套', 'B2024008', 80, today + timedelta(days=365), 'A区-103'),
        ('甲醛溶液', 'B2024009', 2, today + timedelta(days=90), 'C区-危化库'),
        ('培养皿', 'B2024010', 15, today + timedelta(days=180), 'A区-101'),
        ('液氮罐', 'B2024011', 1, today + timedelta(days=730), 'C区-低温库'),
        ('普通玻璃烧杯', 'B2024012', 3, today + timedelta(days=14), 'A区-101'),
    ]
    batch_objs = {}
    for consumable_name, batch_num, quantity, expire, location in batches:
        batch = Batch.objects.create(
            consumable=consumable_objs[consumable_name],
            batch_number=batch_num,
            quantity=quantity,
            expire_date=expire,
            location=location,
            is_active=True
        )
        batch_objs[batch_num] = batch

    teacher_user = User.objects.create_user(username='teacher', password='password')
    stock_user = User.objects.create_user(username='stock', password='password')
    safety_user = User.objects.create_user(username='safety', password='password')
    lab_user = User.objects.create_user(username='lab', password='password')

    group1 = ResearchGroup.objects.create(
        name='材料科学研究组',
        college=college_objs['engineering'],
        leader=teacher_user
    )
    group2 = ResearchGroup.objects.create(
        name='化学分析实验室',
        college=college_objs['science'],
        leader=teacher_user
    )

    UserProfile.objects.create(
        user=teacher_user,
        role='teacher',
        college=college_objs['engineering'],
        research_group=group1,
        has_dangerous_qualification=True
    )
    UserProfile.objects.create(
        user=stock_user,
        role='stock_manager',
        college=college_objs['engineering']
    )
    UserProfile.objects.create(
        user=safety_user,
        role='safety_officer',
        college=college_objs['science'],
        has_dangerous_qualification=True
    )
    UserProfile.objects.create(
        user=lab_user,
        role='lab_manager',
        college=college_objs['engineering']
    )

    app1 = Application.objects.create(
        applicant=teacher_user,
        consumable=consumable_objs['普通玻璃烧杯'],
        batch=batch_objs['B2024001'],
        requested_quantity=10,
        actual_quantity=10,
        research_group=group1,
        purpose='实验教学使用',
        status='returned',
        expected_return_date=today - timedelta(days=5),
        issued_at=timezone.now() - timedelta(days=10),
        returned_at=timezone.now() - timedelta(days=5),
        inventory_checker=stock_user,
        safety_checker=safety_user,
        lab_checker=lab_user
    )
    ApplicationHistory.objects.create(
        application=app1,
        status_before='pending',
        status_after='returned',
        operated_by=teacher_user,
        comment='正常领用流程完成'
    )

    app2 = Application.objects.create(
        applicant=teacher_user,
        consumable=consumable_objs['浓硫酸'],
        requested_quantity=10,
        research_group=group2,
        purpose='实验研究',
        status='rejected',
        exception_reason='stock_shortage',
        exception_note='库存不足，当前库存仅3瓶，无法满足10瓶的需求',
        inventory_checker=stock_user
    )
    ApplicationHistory.objects.create(
        application=app2,
        status_before='pending',
        status_after='rejected',
        operated_by=stock_user,
        comment='库存不足，申请被拒绝'
    )

    teacher_no_qual = User.objects.create_user(username='teacher_no_qual', password='password')
    UserProfile.objects.create(
        user=teacher_no_qual,
        role='teacher',
        college=college_objs['science'],
        research_group=group2,
        has_dangerous_qualification=False
    )
    app3 = Application.objects.create(
        applicant=teacher_no_qual,
        consumable=consumable_objs['甲醛溶液'],
        batch=batch_objs['B2024009'],
        requested_quantity=2,
        research_group=group2,
        purpose='消毒实验',
        status='rejected',
        exception_reason='qualification_missing',
        exception_note='申请人未获得危险品操作资质，无法领用甲醛溶液',
        inventory_checker=stock_user,
        safety_checker=safety_user
    )
    ApplicationHistory.objects.create(
        application=app3,
        status_before='inventory_checked',
        status_after='rejected',
        operated_by=safety_user,
        comment='危险品资质缺失，申请被拒绝'
    )

    app4 = Application.objects.create(
        applicant=teacher_user,
        consumable=consumable_objs['PCR试剂盒'],
        batch=batch_objs['B2024006'],
        requested_quantity=5,
        actual_quantity=5,
        research_group=group1,
        purpose='基因检测实验',
        status='overdue',
        expected_return_date=today - timedelta(days=15),
        issued_at=timezone.now() - timedelta(days=30),
        inventory_checker=stock_user,
        safety_checker=safety_user,
        exception_reason='overdue'
    )
    ApplicationHistory.objects.create(
        application=app4,
        status_before='issued',
        status_after='overdue',
        operated_by=lab_user,
        comment='逾期未归还，已超过预计归还日期15天'
    )

    app5 = Application.objects.create(
        applicant=teacher_user,
        consumable=consumable_objs['无水乙醇'],
        batch=batch_objs['B2024004'],
        requested_quantity=5,
        research_group=group1,
        purpose='实验溶剂',
        status='pending'
    )
    ApplicationHistory.objects.create(
        application=app5,
        status_before='pending',
        status_after='pending',
        operated_by=teacher_user,
        comment='新建申请'
    )

    app6 = Application.objects.create(
        applicant=teacher_user,
        consumable=consumable_objs['防护手套'],
        batch=batch_objs['B2024008'],
        requested_quantity=20,
        actual_quantity=20,
        research_group=group1,
        purpose='安全防护',
        status='issued',
        expected_return_date=today + timedelta(days=7),
        issued_at=timezone.now() - timedelta(days=2),
        inventory_checker=stock_user,
        safety_checker=safety_user
    )
    ApplicationHistory.objects.create(
        application=app6,
        status_before='approved',
        status_after='issued',
        operated_by=stock_user,
        comment='已出库'
    )

class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_initial_data),
    ]
