from app import db
from app.models import Room, Staff, Booking, SetupRequest, CateringRequest, StaffAssignment, IssueReport, CostItem, Review, calculate_booking_total
from datetime import datetime, timedelta


def seed_data():
    if Room.query.first():
        return

    rooms = [
        Room(name="翡翠厅", floor=1, capacity=200, equipment="投影仪,音响系统,无线麦克风,舞台灯光", status="available", image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury hotel grand ballroom with crystal chandeliers and elegant decor, conference style setup, warm lighting&image_size=landscape_16_9"),
        Room(name="琥珀厅", floor=1, capacity=100, equipment="投影仪,音响系统,无线麦克风", status="available", image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern hotel conference room with wooden panels and natural light, boardroom style&image_size=landscape_16_9"),
        Room(name="珊瑚厅", floor=2, capacity=50, equipment="投影仪,白板,视频会议系统", status="available", image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=medium hotel meeting room with glass walls and city view, classroom style&image_size=landscape_16_9"),
        Room(name="珍珠厅", floor=2, capacity=30, equipment="投影仪,白板", status="available", image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=intimate hotel meeting room with round table and leather chairs, u-shape setup&image_size=landscape_16_9"),
        Room(name="玛瑙厅", floor=3, capacity=80, equipment="投影仪,音响系统,无线麦克风,直播设备", status="maintenance", image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hotel meeting room with modern technology and streaming setup, theater style&image_size=landscape_16_9"),
        Room(name="水晶厅", floor=3, capacity=150, equipment="投影仪,音响系统,无线麦克风,舞台灯光,同声传译", status="available", image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant hotel ballroom with stage and simultaneous interpretation booths, banquet style&image_size=landscape_16_9"),
    ]
    db.session.add_all(rooms)

    staffs = [
        Staff(name="张明", role="宴会主管", skills="大型宴会统筹,现场指挥", phone="13800001001", status="available"),
        Staff(name="李红", role="服务领班", skills="茶歇服务,桌面布置", phone="13800001002", status="available"),
        Staff(name="王刚", role="音控师", skills="音响调试,灯光控制", phone="13800001003", status="available"),
        Staff(name="赵芳", role="服务员", skills="桌面服务,茶歇摆放", phone="13800001004", status="available"),
        Staff(name="陈伟", role="技术支持", skills="投影调试,视频会议,直播", phone="13800001005", status="available"),
        Staff(name="刘娜", role="服务领班", skills="VIP接待,桌面布置", phone="13800001006", status="available"),
        Staff(name="孙强", role="安保人员", skills="安全巡查,应急处理", phone="13800001007", status="available"),
        Staff(name="周敏", role="服务员", skills="桌面服务,客房配送", phone="13800001008", status="available"),
    ]
    db.session.add_all(staffs)
    db.session.flush()

    now = datetime.now()
    base_date = now.replace(hour=9, minute=0, second=0, microsecond=0)

    bookings_data = [
        {
            "title": "星辰科技2025年度战略大会",
            "room_id": rooms[0].id,
            "client_name": "星辰科技有限公司",
            "client_contact": "杨总 13900001001",
            "attendees": 180,
            "start_offset": 1,
            "duration": 8,
            "status": "confirmed",
            "notes": "需要同声传译设备，VIP接待",
        },
        {
            "title": "碧海集团新品发布会",
            "room_id": rooms[1].id,
            "client_name": "碧海集团有限公司",
            "client_contact": "林经理 13900001002",
            "attendees": 80,
            "start_offset": 2,
            "duration": 4,
            "status": "confirmed",
            "notes": "需要直播设备",
        },
        {
            "title": "云帆教育教师培训研讨会",
            "room_id": rooms[2].id,
            "client_name": "云帆教育科技",
            "client_contact": "陈主任 13900001003",
            "attendees": 40,
            "start_offset": 0,
            "duration": 6,
            "status": "in_progress",
            "notes": "课桌式布局",
        },
        {
            "title": "鑫盛投资季度董事会",
            "room_id": rooms[3].id,
            "client_name": "鑫盛投资控股",
            "client_contact": "吴秘书 13900001004",
            "attendees": 20,
            "start_offset": 3,
            "duration": 3,
            "status": "draft",
            "notes": "U型布局，需视频会议系统",
        },
        {
            "title": "明德医药学术研讨会",
            "room_id": rooms[5].id,
            "client_name": "明德医药集团",
            "client_contact": "赵博士 13900001005",
            "attendees": 120,
            "start_offset": 5,
            "duration": 8,
            "status": "confirmed",
            "notes": "需要同声传译，茶歇两场",
        },
        {
            "title": "锐思咨询团队建设活动",
            "room_id": rooms[1].id,
            "client_name": "锐思管理咨询",
            "client_contact": "周经理 13900001006",
            "attendees": 60,
            "start_offset": -2,
            "duration": 5,
            "status": "completed",
            "notes": "团建活动",
        },
        {
            "title": "蓝桥网络技术分享会",
            "room_id": rooms[4].id,
            "client_name": "蓝桥网络科技",
            "client_contact": "刘工 13900001007",
            "attendees": 70,
            "start_offset": 4,
            "duration": 4,
            "status": "cancelled",
            "notes": "客户临时取消",
        },
        {
            "title": "远景能源合作伙伴峰会",
            "room_id": rooms[0].id,
            "client_name": "远景能源集团",
            "client_contact": "马总 13900001008",
            "attendees": 190,
            "start_offset": 7,
            "duration": 8,
            "status": "confirmed",
            "notes": "需主舞台+签到区+展示区",
        },
    ]

    bookings = []
    for bd in bookings_data:
        start = base_date + timedelta(days=bd["start_offset"])
        end = start + timedelta(hours=bd["duration"])
        booking = Booking(
            title=bd["title"],
            room_id=bd["room_id"],
            client_name=bd["client_name"],
            client_contact=bd["client_contact"],
            attendees=bd["attendees"],
            start_time=start,
            end_time=end,
            status=bd["status"],
            notes=bd["notes"],
        )
        bookings.append(booking)
    db.session.add_all(bookings)
    db.session.flush()

    setup_requests = [
        SetupRequest(booking_id=bookings[0].id, layout_type="剧院式", requirements="主舞台+背景板+签到台", special_requests="需要同声传译隔间", status="confirmed", expected_complete=bookings[0].start_time - timedelta(hours=2), confirmed_at=now - timedelta(hours=12)),
        SetupRequest(booking_id=bookings[1].id, layout_type="课桌式", requirements="投影幕布+直播机位", special_requests="网络带宽需100M以上", status="pending", expected_complete=bookings[1].start_time - timedelta(hours=1)),
        SetupRequest(booking_id=bookings[2].id, layout_type="课桌式", requirements="白板+翻页笔+签到表", special_requests="", status="confirmed", expected_complete=bookings[2].start_time - timedelta(hours=1), confirmed_at=now - timedelta(hours=6)),
        SetupRequest(booking_id=bookings[4].id, layout_type="剧院式", requirements="主舞台+背景板+签到区+展示区", special_requests="同声传译设备3个语种", status="pending", expected_complete=bookings[4].start_time - timedelta(hours=3)),
        SetupRequest(booking_id=bookings[7].id, layout_type="宴会式", requirements="主舞台+圆桌+签到区+展示区", special_requests="需要LED大屏", status="pending", expected_complete=bookings[7].start_time - timedelta(hours=4)),
    ]
    db.session.add_all(setup_requests)

    catering_requests = [
        CateringRequest(booking_id=bookings[0].id, package_type="豪华套餐", pax=180, extra_items="咖啡机2台,矿泉水200瓶", equipment_needs="长条茶歇台4张", status="confirmed", serve_time=bookings[0].start_time + timedelta(hours=2)),
        CateringRequest(booking_id=bookings[1].id, package_type="标准套餐", pax=80, extra_items="矿泉水100瓶", equipment_needs="茶歇台2张", status="pending", serve_time=bookings[1].start_time + timedelta(hours=2)),
        CateringRequest(booking_id=bookings[2].id, package_type="简约套餐", pax=40, extra_items="绿茶,咖啡", equipment_needs="茶歇台1张", status="confirmed", serve_time=bookings[2].start_time + timedelta(hours=3)),
        CateringRequest(booking_id=bookings[4].id, package_type="豪华套餐", pax=120, extra_items="咖啡机3台,矿泉水300瓶,果汁", equipment_needs="长条茶歇台6张", status="pending", serve_time=bookings[4].start_time + timedelta(hours=2)),
        CateringRequest(booking_id=bookings[7].id, package_type="尊享套餐", pax=190, extra_items="红酒,香槟,咖啡机4台", equipment_needs="长条茶歇台8张,酒水台2张", status="pending", serve_time=bookings[7].start_time + timedelta(hours=1)),
    ]
    db.session.add_all(catering_requests)

    staff_assignments = [
        StaffAssignment(booking_id=bookings[0].id, staff_id=staffs[0].id, role="宴会主管", shift_start=bookings[0].start_time - timedelta(hours=2), shift_end=bookings[0].end_time + timedelta(hours=1), status="assigned"),
        StaffAssignment(booking_id=bookings[0].id, staff_id=staffs[1].id, role="服务领班", shift_start=bookings[0].start_time - timedelta(hours=1), shift_end=bookings[0].end_time, status="assigned"),
        StaffAssignment(booking_id=bookings[0].id, staff_id=staffs[2].id, role="音控师", shift_start=bookings[0].start_time - timedelta(hours=2), shift_end=bookings[0].end_time, status="assigned"),
        StaffAssignment(booking_id=bookings[0].id, staff_id=staffs[3].id, role="服务员", shift_start=bookings[0].start_time - timedelta(hours=1), shift_end=bookings[0].end_time, status="assigned"),
        StaffAssignment(booking_id=bookings[1].id, staff_id=staffs[5].id, role="服务领班", shift_start=bookings[1].start_time - timedelta(hours=1), shift_end=bookings[1].end_time, status="assigned"),
        StaffAssignment(booking_id=bookings[1].id, staff_id=staffs[4].id, role="技术支持", shift_start=bookings[1].start_time - timedelta(hours=1), shift_end=bookings[1].end_time, status="assigned"),
        StaffAssignment(booking_id=bookings[2].id, staff_id=staffs[7].id, role="服务员", shift_start=bookings[2].start_time - timedelta(hours=1), shift_end=bookings[2].end_time, status="checked_in"),
        StaffAssignment(booking_id=bookings[4].id, staff_id=staffs[0].id, role="宴会主管", shift_start=bookings[4].start_time - timedelta(hours=3), shift_end=bookings[4].end_time + timedelta(hours=1), status="assigned"),
        StaffAssignment(booking_id=bookings[7].id, staff_id=staffs[0].id, role="宴会主管", shift_start=bookings[7].start_time - timedelta(hours=4), shift_end=bookings[7].end_time + timedelta(hours=2), status="assigned"),
        StaffAssignment(booking_id=bookings[7].id, staff_id=staffs[6].id, role="安保人员", shift_start=bookings[7].start_time - timedelta(hours=2), shift_end=bookings[7].end_time + timedelta(hours=1), status="assigned"),
    ]
    db.session.add_all(staff_assignments)

    issue_reports = [
        IssueReport(booking_id=bookings[2].id, title="投影仪色彩偏色", description="主投影仪显示偏蓝，影响PPT展示效果", priority="high", status="in_progress", reported_by="陈伟", assigned_to="王刚", created_at=now - timedelta(hours=2)),
        IssueReport(booking_id=bookings[2].id, title="茶歇供应延迟", description="上午茶歇比预定时间晚了15分钟", priority="medium", status="open", reported_by="李红", assigned_to="张明", created_at=now - timedelta(hours=1)),
        IssueReport(booking_id=bookings[0].id, title="签到台排队过长", description="会议签到高峰期排队超过10分钟", priority="medium", status="resolved", reported_by="张明", assigned_to="赵芳", resolution="增设临时签到台，分流处理", created_at=now - timedelta(days=1), resolved_at=now - timedelta(hours=12)),
        IssueReport(booking_id=bookings[5].id, title="空调温度过高", description="会议进行中室内温度偏高，参会者反映闷热", priority="low", status="closed", reported_by="周敏", assigned_to="张明", resolution="已联系工程部调低空调温度", created_at=now - timedelta(days=3), resolved_at=now - timedelta(days=3, hours=1)),
    ]
    db.session.add_all(issue_reports)

    cost_items = [
        CostItem(booking_id=bookings[0].id, category="场地费", description="翡翠厅全天使用", amount=28000.0, status="approved", approved_by="吴经理", approved_at=now - timedelta(hours=6), comment=""),
        CostItem(booking_id=bookings[0].id, category="茶歇费", description="豪华套餐×180人", amount=12600.0, status="approved", approved_by="吴经理", approved_at=now - timedelta(hours=6), comment=""),
        CostItem(booking_id=bookings[0].id, category="设备费", description="同声传译设备×3语种", amount=9000.0, status="pending", comment="需确认语种需求"),
        CostItem(booking_id=bookings[0].id, category="人员费", description="服务人员4人×全天", amount=4800.0, status="pending", comment=""),
        CostItem(booking_id=bookings[1].id, category="场地费", description="琥珀厅半天使用", amount=10000.0, status="approved", approved_by="吴经理", approved_at=now - timedelta(hours=12), comment=""),
        CostItem(booking_id=bookings[1].id, category="茶歇费", description="标准套餐×80人", amount=4000.0, status="pending", comment=""),
        CostItem(booking_id=bookings[1].id, category="设备费", description="直播设备", amount=5000.0, status="pending", comment="含直播推流服务"),
        CostItem(booking_id=bookings[2].id, category="场地费", description="珊瑚厅全天使用", amount=6000.0, status="approved", approved_by="吴经理", approved_at=now - timedelta(hours=18), comment=""),
        CostItem(booking_id=bookings[2].id, category="茶歇费", description="简约套餐×40人", amount=1600.0, status="approved", approved_by="吴经理", approved_at=now - timedelta(hours=18), comment=""),
        CostItem(booking_id=bookings[4].id, category="场地费", description="水晶厅全天使用", amount=35000.0, status="pending", comment="待确认"),
        CostItem(booking_id=bookings[4].id, category="茶歇费", description="豪华套餐×120人×2场", amount=16800.0, status="pending", comment="两场茶歇"),
        CostItem(booking_id=bookings[4].id, category="设备费", description="同声传译设备×3语种+舞台灯光", amount=15000.0, status="pending", comment=""),
        CostItem(booking_id=bookings[7].id, category="场地费", description="翡翠厅全天使用", amount=28000.0, status="pending", comment=""),
        CostItem(booking_id=bookings[7].id, category="茶歇费", description="尊享套餐×190人", amount=19000.0, status="pending", comment="含酒水"),
        CostItem(booking_id=bookings[5].id, category="场地费", description="琥珀厅全天使用", amount=18000.0, status="approved", approved_by="吴经理", approved_at=now - timedelta(days=2), comment=""),
        CostItem(booking_id=bookings[5].id, category="茶歇费", description="标准套餐×60人", amount=3000.0, status="approved", approved_by="吴经理", approved_at=now - timedelta(days=2), comment=""),
    ]
    db.session.add_all(cost_items)

    for booking in bookings:
        booking.total_cost = calculate_booking_total(booking.cost_items)

    reviews = [
        Review(booking_id=bookings[5].id, overall_rating=4, service_rating=4, facility_rating=3, issues_summary="空调温度过高，调整后改善", improvements="建议提前检查空调系统", notes="整体满意，团队建设活动圆满完成", created_at=now - timedelta(days=2)),
    ]
    db.session.add_all(reviews)

    db.session.commit()
