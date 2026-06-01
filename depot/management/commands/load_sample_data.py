import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from depot.models import (
    Station, Staff, Package, PickupReminder, RetentionAlert,
    AbnormalPackage, Complaint, Responsibility,
    ReturnRecord,
)


class Command(BaseCommand):
    help = "加载示例数据到系统"

    def handle(self, *args, **options):
        self.stdout.write("正在清除旧数据...")
        ReturnRecord.objects.all().delete()
        Responsibility.objects.all().delete()
        Complaint.objects.all().delete()
        AbnormalPackage.objects.all().delete()
        RetentionAlert.objects.all().delete()
        PickupReminder.objects.all().delete()
        Package.objects.all().delete()
        Staff.objects.all().delete()
        Station.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

        self.stdout.write("创建驿站...")
        stations = []
        station_data = [
            ("朝阳路驿站", "CY-001", "北京市朝阳区朝阳路88号", "朝阳区", "010-12345678"),
            ("望京驿站", "WJ-002", "北京市朝阳区望京西路10号", "朝阳区", "010-23456789"),
            ("中关村驿站", "ZGC-003", "北京市海淀区中关村大街1号", "海淀区", "010-34567890"),
            ("西直门驿站", "XZM-004", "北京市西城区西直门外大街5号", "西城区", "010-45678901"),
            ("通州万达驿站", "TZ-005", "北京市通州区新华西街58号", "通州区", "010-56789012"),
        ]
        for name, code, addr, dist, phone in station_data:
            s = Station.objects.create(name=name, code=code, address=addr, district=dist, phone=phone)
            stations.append(s)

        self.stdout.write("创建用户和员工...")
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@depot.com", "is_superuser": True, "is_staff": True}
        )
        admin_user.set_password("admin123")
        admin_user.save()
        staff_data = [
            ("张伟", "clerk", stations[0], "13800000001"),
            ("李娜", "clerk", stations[1], "13800000002"),
            ("王强", "clerk", stations[2], "13800000003"),
            ("赵敏", "supervisor", stations[0], "13800000004"),
            ("陈刚", "supervisor", stations[2], "13800000005"),
            ("刘芳", "cs_specialist", stations[0], "13800000006"),
            ("杨洋", "cs_specialist", stations[1], "13800000007"),
        ]
        staffs = []
        for i, (name, role, st, phone) in enumerate(staff_data):
            username = f"staff{i+1}"
            user = User.objects.create_user(username, f"{username}@depot.com", "staff123")
            staff = Staff.objects.create(user=user, name=name, role=role, station=st, phone=phone)
            staffs.append(staff)

        self.stdout.write("创建包裹...")
        carriers = ["sf", "yt", "zt", "st", "yd", "ems", "jd"]
        carrier_names = ["顺丰", "圆通", "中通", "申通", "韵达", "EMS", "京东"]
        shelf_codes = ["A-01-01", "A-01-02", "A-02-01", "B-01-03", "B-02-02", "C-01-01", "C-03-02"]
        surnames = ["张", "李", "王", "赵", "陈", "刘", "杨", "黄", "周", "吴"]
        given_names = ["伟", "娜", "强", "敏", "刚", "芳", "洋", "秀英", "明", "丽"]
        statuses = ["checked_in", "pending_pickup", "picked_up", "retention", "abnormal", "returned"]

        packages = []
        now = timezone.now()

        pkg_configs = [
            ("SF1234567890", "sf", -1, "checked_in", stations[0], staffs[0]),
            ("YT2345678901", "yt", -2, "pending_pickup", stations[0], staffs[0]),
            ("ZT3456789012", "zt", -3, "pending_pickup", stations[1], staffs[1]),
            ("ST4567890123", "st", -8, "retention", stations[0], staffs[0]),
            ("YD5678901234", "yd", -10, "retention", stations[1], staffs[1]),
            ("JD6789012345", "jd", -6, "retention", stations[2], staffs[2]),
            ("EMS7890123456", "ems", -2, "abnormal", stations[0], staffs[0]),
            ("SF8901234567", "sf", -1, "picked_up", stations[2], staffs[2]),
            ("YT9012345678", "yt", -5, "picked_up", stations[3], None),
            ("ZT0123456789", "zt", -12, "returned", stations[0], staffs[0]),
            ("SF1112223334", "sf", -1, "checked_in", stations[3], None),
            ("YT5556667778", "yt", -3, "pending_pickup", stations[4], None),
            ("JD9998887776", "jd", -15, "retention", stations[4], None),
            ("EMS4443332221", "ems", -4, "abnormal", stations[2], staffs[2]),
            ("ST7778889990", "st", -1, "checked_in", stations[1], staffs[1]),
        ]

        for tracking, carrier, days_offset, status, station, checkin_staff in pkg_configs:
            checkin_time = now + timedelta(days=days_offset)
            sender = random.choice(surnames) + random.choice(given_names)
            receiver = random.choice(surnames) + random.choice(given_names)
            pkg = Package(
                tracking_number=tracking,
                sender_name=sender,
                sender_phone=f"139{random.randint(10000000, 99999999)}",
                receiver_name=receiver,
                receiver_phone=f"136{random.randint(10000000, 99999999)}",
                station=station,
                status=status,
                shelf_code=random.choice(shelf_codes),
                carrier=carrier,
                checked_in_at=checkin_time,
                checked_in_by=checkin_staff,
            )
            if status == "picked_up":
                pkg.picked_up_at = checkin_time + timedelta(days=random.randint(0, 2))
                pkg.picked_up_by_name = receiver
            pkg.save()
            packages.append(pkg)

        self.stdout.write("创建取件提醒...")
        reminder_pkgs = [p for p in packages if p.status in ["pending_pickup", "retention", "picked_up"]]
        for pkg in reminder_pkgs[:6]:
            PickupReminder.objects.create(
                package=pkg,
                reminder_type=random.choice(["sms", "call", "app_notify"]),
                sent_by=random.choice(staffs[:3]),
                status=random.choice(["sent", "delivered"]),
                response=random.choice(["", "no_response", "confirmed_pickup", "delayed_pickup"]),
            )

        self.stdout.write("创建异常件...")
        abnormal_pkgs = [p for p in packages if p.status == "abnormal"]
        abnormal_types = ["damaged", "lost", "wrong_station", "expired", "wrong_item"]
        abnormal_descs = {
            "damaged": "包裹外包装严重破损，内件可能受损",
            "lost": "包裹在转运过程中丢失，系统无追踪记录",
            "wrong_station": "包裹错分至本驿站，应发往其他站点",
            "expired": "包裹已超期多日，收件人未取件",
            "wrong_item": "包裹内物品与订单不符，疑似错发",
        }
        for pkg in abnormal_pkgs:
            ab_type = random.choice(abnormal_types)
            AbnormalPackage.objects.create(
                package=pkg,
                abnormal_type=ab_type,
                description=abnormal_descs[ab_type],
                registered_by=random.choice(staffs[:3]),
                status="pending",
            )

        self.stdout.write("创建滞留预警...")
        from depot.services import check_retention_alerts
        check_retention_alerts()

        self.stdout.write("创建投诉...")
        complaint_data = [
            (packages[3], "delayed_pickup", "包裹已到站多日，驿站未及时通知取件，严重影响使用"),
            (packages[5], "damaged", "取件时发现包裹已破损，内件损坏无法使用，要求赔偿"),
            (packages[6], "poor_service", "到驿站取件时店员态度恶劣，多次催促不予理睬"),
            (None, "other", "多次在驿站取件体验极差，包裹经常找不到，要求改善服务"),
        ]
        complaint_names = ["孙小明", "周大伟", "吴丽华", "郑伟"]
        for i, (pkg, ctype, desc) in enumerate(complaint_data):
            c = Complaint(
                package=pkg,
                complainant_name=complaint_names[i],
                complainant_phone=f"137{random.randint(10000000, 99999999)}",
                complaint_type=ctype,
                description=desc,
                station=pkg.station if pkg else stations[0],
                status="pending" if i < 2 else "accepted",
            )
            c.save()
            if i == 3:
                c.accepted_at = now - timedelta(hours=2)
                c.accepted_by = staffs[5]
                c.save()

        self.stdout.write("创建责任处理...")
        complaints = list(Complaint.objects.all())
        if len(complaints) >= 2:
            Responsibility.objects.create(
                complaint=complaints[0],
                responsible_staff=staffs[0],
                responsibility_type="partial",
                penalty_type="warning",
                description="未及时发送取件提醒，导致包裹滞留",
                created_by=staffs[3],
                status="pending",
            )
            Responsibility.objects.create(
                complaint=complaints[1],
                responsible_staff=staffs[1],
                responsibility_type="full",
                penalty_type="fine",
                penalty_amount=200,
                description="包裹入库时未检查完整性，导致破损包裹上架",
                created_by=staffs[5],
                status="confirmed",
            )

        self.stdout.write("创建退回记录...")
        returned_pkgs = [p for p in packages if p.status == "returned"]
        for pkg in returned_pkgs:
            ReturnRecord.objects.create(
                package=pkg,
                return_reason="retention_expired",
                returned_to="发件人地址 - " + pkg.sender_name,
                returned_by=staffs[0],
                return_carrier="顺丰",
                return_tracking=f"RT{random.randint(1000000000, 9999999999)}",
                remark="滞留超期退回",
            )

        self.stdout.write(self.style.SUCCESS("✅ 示例数据加载完成!"))
        self.stdout.write(f"  驿站: {Station.objects.count()} 个")
        self.stdout.write(f"  员工: {Staff.objects.count()} 人")
        self.stdout.write(f"  包裹: {Package.objects.count()} 件")
        self.stdout.write(f"  取件提醒: {PickupReminder.objects.count()} 条")
        self.stdout.write(f"  滞留预警: {RetentionAlert.objects.count()} 条")
        self.stdout.write(f"  异常件: {AbnormalPackage.objects.count()} 件")
        self.stdout.write(f"  投诉: {Complaint.objects.count()} 条")
        self.stdout.write(f"  责任处理: {Responsibility.objects.count()} 条")
        self.stdout.write(f"  退回记录: {ReturnRecord.objects.count()} 条")
        self.stdout.write("")
        self.stdout.write("登录账号:")
        self.stdout.write("  管理员: admin / admin123")
        self.stdout.write("  员工: staff1~staff7 / staff123")
