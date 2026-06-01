import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config import Config

db = SQLAlchemy()


def create_app():
    template_dir = os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(__file__))), "templates")
    static_dir = os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(__file__))), "static")
    app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
    app.config.from_object(Config)

    db.init_app(app)

    from app.blueprints.dashboard import dashboard_bp
    from app.blueprints.rooms import rooms_bp
    from app.blueprints.bookings import bookings_bp
    from app.blueprints.setups import setups_bp
    from app.blueprints.caterings import caterings_bp
    from app.blueprints.staffs import staffs_bp
    from app.blueprints.issues import issues_bp
    from app.blueprints.costs import costs_bp
    from app.blueprints.reviews import reviews_bp

    app.register_blueprint(dashboard_bp)
    app.register_blueprint(rooms_bp, url_prefix="/rooms")
    app.register_blueprint(bookings_bp, url_prefix="/bookings")
    app.register_blueprint(setups_bp, url_prefix="/setups")
    app.register_blueprint(caterings_bp, url_prefix="/caterings")
    app.register_blueprint(staffs_bp, url_prefix="/staffs")
    app.register_blueprint(issues_bp, url_prefix="/issues")
    app.register_blueprint(costs_bp, url_prefix="/costs")
    app.register_blueprint(reviews_bp, url_prefix="/reviews")

    with app.app_context():
        from app import models
        db.create_all()
        from app.seed import seed_data
        seed_data()

    return app
