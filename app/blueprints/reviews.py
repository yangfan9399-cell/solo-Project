from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.models import Review, Booking
from app import db

reviews_bp = Blueprint("reviews", __name__)

@reviews_bp.route("/")
def list_reviews():
    reviews = Review.query.order_by(Review.created_at.desc()).all()
    return render_template("reviews/list.html", reviews=reviews)

@reviews_bp.route("/new", methods=["GET", "POST"])
def new_review():
    bookings = Booking.query.filter_by(status="completed").order_by(Booking.start_time.desc()).all()
    if request.method == "POST":
        review = Review(
            booking_id=request.form.get("booking_id", type=int),
            overall_rating=request.form.get("overall_rating", 0, type=int),
            service_rating=request.form.get("service_rating", 0, type=int),
            facility_rating=request.form.get("facility_rating", 0, type=int),
            issues_summary=request.form.get("issues_summary", ""),
            improvements=request.form.get("improvements", ""),
            notes=request.form.get("notes", ""),
        )
        db.session.add(review)
        db.session.commit()
        flash("复盘记录创建成功", "success")
        return redirect(url_for("reviews.detail", id=review.id))
    return render_template("reviews/form.html", review=None, bookings=bookings)

@reviews_bp.route("/<int:id>")
def detail(id):
    review = Review.query.get_or_404(id)
    return render_template("reviews/detail.html", review=review)
