from flask import Blueprint, render_template, request
from app.models import Room, Booking
from datetime import datetime, timedelta
from app import db

rooms_bp = Blueprint("rooms", __name__)

@rooms_bp.route("/")
def list_rooms():
    floor = request.args.get("floor", type=int)
    capacity = request.args.get("capacity", type=int)
    query = Room.query
    if floor:
        query = query.filter_by(floor=floor)
    if capacity:
        query = query.filter(Room.capacity >= capacity)
    rooms = query.order_by(Room.floor, Room.name).all()
    floors = db.session.query(Room.floor).distinct().order_by(Room.floor).all()
    return render_template("rooms/list.html", rooms=rooms, floors=floors, current_floor=floor, current_capacity=capacity)

@rooms_bp.route("/<int:id>")
def detail(id):
    room = Room.query.get_or_404(id)
    now = datetime.now()
    week_offset = request.args.get("week_offset", 0, type=int)
    week_start = now + timedelta(weeks=week_offset)
    week_start = week_start - timedelta(days=week_start.weekday())
    week_end = week_start + timedelta(days=7)
    bookings = Booking.query.filter(
        Booking.room_id == id,
        Booking.start_time >= week_start,
        Booking.start_time < week_end,
        Booking.status != "cancelled"
    ).order_by(Booking.start_time).all()

    day_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    calendar_days = []
    for i in range(7):
        day_date = week_start + timedelta(days=i)
        day_bookings = [b for b in bookings if b.start_time.date() == day_date.date()]
        calendar_days.append({
            "date": day_date,
            "name": day_names[i],
            "is_today": day_date.date() == now.date(),
            "bookings": day_bookings,
        })

    week_end_str = (week_start + timedelta(days=6)).strftime("%m/%d")
    week_start_str = week_start.strftime("%m/%d")

    return render_template("rooms/detail.html", room=room, bookings=bookings, calendar_days=calendar_days, week_start=week_start, week_start_str=week_start_str, week_end_str=week_end_str, week_offset=week_offset, now=now)
