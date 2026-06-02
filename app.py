from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from datetime import datetime
from config import Config
from models import db, VenueActivity, InjuryEvent, OnSiteTreatment, Evidence, InsuranceReport, ReviewRectification, CompensationPayment, ExceptionFeedback
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    @app.context_processor
    def inject_constants():
        return {
            'status_colors': {
                '待处理': 'bg-yellow-100 text-yellow-800',
                '现场处置中': 'bg-blue-100 text-blue-800',
                '已报案': 'bg-purple-100 text-purple-800',
                '跟进中': 'bg-orange-100 text-orange-800',
                '已结案': 'bg-green-100 text-green-800',
                '已归档': 'bg-gray-100 text-gray-800'
            },
            'severity_colors': {
                '轻微': 'bg-green-100 text-green-800',
                '一般': 'bg-yellow-100 text-yellow-800',
                '严重': 'bg-red-100 text-red-800',
                '危重': 'bg-red-600 text-white'
            },
            'risk_colors': {
                'low': 'bg-green-100 text-green-800',
                'medium': 'bg-yellow-100 text-yellow-800',
                'high': 'bg-red-100 text-red-800'
            },
            'status_list': ['待处理', '现场处置中', '已报案', '跟进中', '已结案', '已归档'],
            'severity_list': ['轻微', '一般', '严重', '危重'],
            'role_list': ['场馆值班员', '医务点人员', '保险联络员']
        }
    
    @app.route('/')
    def dashboard():
        events = InjuryEvent.query.order_by(InjuryEvent.created_at.desc()).all()
        activities = VenueActivity.query.filter_by(is_active=True).order_by(VenueActivity.start_time.desc()).all()
        
        stats = {
            'total': len(events),
            'pending': len([e for e in events if e.status == '待处理']),
            'processing': len([e for e in events if e.status in ['现场处置中', '已报案', '跟进中']]),
            'completed': len([e for e in events if e.status in ['已结案', '已归档']]),
            'high_risk': len([e for e in events if e.risk_level == 'high']),
            'active_activities': len(activities)
        }
        
        recent_events = events[:5]
        pending_feedback = ExceptionFeedback.query.filter_by(handled=False).all()
        
        return render_template('dashboard.html', 
                             events=events, 
                             activities=activities, 
                             stats=stats,
                             recent_events=recent_events,
                             pending_feedback=pending_feedback)
    
    @app.route('/events')
    def event_list():
        status = request.args.get('status', '')
        severity = request.args.get('severity', '')
        risk = request.args.get('risk', '')
        
        query = InjuryEvent.query
        if status:
            query = query.filter_by(status=status)
        if severity:
            query = query.filter_by(severity=severity)
        if risk:
            query = query.filter_by(risk_level=risk)
        
        events = query.order_by(InjuryEvent.created_at.desc()).all()
        
        if request.headers.get('HX-Request'):
            return render_template('partials/event_list.html', events=events)
        
        return render_template('event_list.html', events=events)
    
    @app.route('/events/<int:event_id>')
    def event_detail(event_id):
        event = InjuryEvent.query.get_or_404(event_id)
        return render_template('event_detail.html', event=event)
    
    @app.route('/events/new', methods=['GET', 'POST'])
    def event_create():
        activities = VenueActivity.query.filter_by(is_active=True).all()
        
        if request.method == 'POST':
            try:
                event_no = f"INJ{datetime.now().strftime('%Y%m%d%H%M%S')}"
                
                injury_time = datetime.strptime(request.form['injury_time'], '%Y-%m-%dT%H:%M')
                
                severity = request.form['severity']
                risk_level = 'low'
                if severity in ['严重', '危重']:
                    risk_level = 'high'
                elif severity == '一般':
                    risk_level = 'medium'
                
                event = InjuryEvent(
                    event_no=event_no,
                    activity_id=request.form['activity_id'],
                    reporter_name=request.form['reporter_name'],
                    reporter_role=request.form['reporter_role'],
                    injured_name=request.form['injured_name'],
                    injured_gender=request.form.get('injured_gender', ''),
                    injured_age=request.form.get('injured_age', type=int),
                    injury_time=injury_time,
                    injury_location=request.form['injury_location'],
                    injury_type=request.form['injury_type'],
                    injury_part=request.form.get('injury_part', ''),
                    severity=severity,
                    description=request.form['description'],
                    risk_level=risk_level
                )
                
                db.session.add(event)
                db.session.commit()
                
                if request.headers.get('HX-Request'):
                    return render_template('partials/event_card.html', event=event)
                
                flash('伤情事件上报成功！', 'success')
                return redirect(url_for('event_detail', event_id=event.id))
            except Exception as e:
                db.session.rollback()
                flash(f'上报失败：{str(e)}', 'error')
                return redirect(url_for('event_create'))
        
        return render_template('event_form.html', activities=activities, event=None)
    
    @app.route('/events/<int:event_id>/status', methods=['POST'])
    def update_event_status(event_id):
        event = InjuryEvent.query.get_or_404(event_id)
        new_status = request.form.get('status')
        if new_status:
            event.status = new_status
            db.session.commit()
        
        if request.headers.get('HX-Request'):
            return f'<span class="px-3 py-1 rounded-full text-sm font-medium {get_status_color(new_status)}">{new_status}</span>'
        
        return redirect(url_for('event_detail', event_id=event_id))
    
    @app.route('/activities')
    def activity_list():
        activities = VenueActivity.query.order_by(VenueActivity.start_time.desc()).all()
        return render_template('activity_list.html', activities=activities)
    
    @app.route('/activities/new', methods=['GET', 'POST'])
    def activity_create():
        if request.method == 'POST':
            try:
                start_time = datetime.strptime(request.form['start_time'], '%Y-%m-%dT%H:%M')
                end_time = None
                if request.form.get('end_time'):
                    end_time = datetime.strptime(request.form['end_time'], '%Y-%m-%dT%H:%M')
                
                activity = VenueActivity(
                    activity_name=request.form['activity_name'],
                    venue=request.form['venue'],
                    activity_type=request.form.get('activity_type', ''),
                    start_time=start_time,
                    end_time=end_time,
                    participant_count=request.form.get('participant_count', 0, type=int),
                    organizer=request.form.get('organizer', ''),
                    contact_phone=request.form.get('contact_phone', ''),
                    remarks=request.form.get('remarks', '')
                )
                
                db.session.add(activity)
                db.session.commit()
                
                flash('活动创建成功！', 'success')
                return redirect(url_for('activity_list'))
            except Exception as e:
                db.session.rollback()
                flash(f'创建失败：{str(e)}', 'error')
        
        return render_template('activity_form.html', activity=None)
    
    @app.route('/events/<int:event_id>/treatment', methods=['POST'])
    def add_treatment(event_id):
        try:
            treatment_time = datetime.strptime(request.form['treatment_time'], '%Y-%m-%dT%H:%M')
            
            treatment = OnSiteTreatment(
                event_id=event_id,
                handler_name=request.form['handler_name'],
                treatment_time=treatment_time,
                measures=request.form['measures'],
                vital_signs=request.form.get('vital_signs', ''),
                medication=request.form.get('medication', ''),
                referred=request.form.get('referred') == 'on',
                referral_hospital=request.form.get('referral_hospital', ''),
                next_steps=request.form.get('next_steps', '')
            )
            
            db.session.add(treatment)
            
            event = InjuryEvent.query.get(event_id)
            if event.status == '待处理':
                event.status = '现场处置中'
            
            db.session.commit()
            flash('现场处置记录已添加！', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'添加失败：{str(e)}', 'error')
        
        return redirect(url_for('event_detail', event_id=event_id))
    
    @app.route('/events/<int:event_id>/insurance', methods=['POST'])
    def add_insurance_report(event_id):
        try:
            report_time = datetime.strptime(request.form['report_time'], '%Y-%m-%dT%H:%M')
            
            report = InsuranceReport(
                event_id=event_id,
                report_no=request.form.get('report_no', ''),
                reporter=request.form['reporter'],
                report_time=report_time,
                insurance_company=request.form.get('insurance_company', ''),
                policy_no=request.form.get('policy_no', ''),
                claimant_name=request.form.get('claimant_name', ''),
                claimant_contact=request.form.get('claimant_contact', ''),
                estimated_amount=request.form.get('estimated_amount', 0.0, type=float),
                status=request.form.get('status', '已报案'),
                remarks=request.form.get('remarks', '')
            )
            
            db.session.add(report)
            
            event = InjuryEvent.query.get(event_id)
            if event.status in ['待处理', '现场处置中']:
                event.status = '已报案'
            
            db.session.commit()
            flash('保险报案成功！', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'报案失败：{str(e)}', 'error')
        
        return redirect(url_for('event_detail', event_id=event_id))
    
    @app.route('/events/<int:event_id>/review', methods=['POST'])
    def add_review(event_id):
        try:
            review_time = datetime.strptime(request.form['review_time'], '%Y-%m-%dT%H:%M')
            deadline = None
            if request.form.get('deadline'):
                deadline = datetime.strptime(request.form['deadline'], '%Y-%m-%dT%H:%M')
            
            review = ReviewRectification(
                event_id=event_id,
                reviewer=request.form['reviewer'],
                review_time=review_time,
                root_cause=request.form['root_cause'],
                improvement_measures=request.form['improvement_measures'],
                responsible_person=request.form.get('responsible_person', ''),
                deadline=deadline,
                completed=False
            )
            
            db.session.add(review)
            db.session.commit()
            flash('复盘整改记录已添加！', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'添加失败：{str(e)}', 'error')
        
        return redirect(url_for('event_detail', event_id=event_id))
    
    @app.route('/events/<int:event_id>/payment', methods=['POST'])
    def add_payment(event_id):
        try:
            payment_time = None
            if request.form.get('payment_time'):
                payment_time = datetime.strptime(request.form['payment_time'], '%Y-%m-%dT%H:%M')
            
            payment = CompensationPayment(
                event_id=event_id,
                insurance_report_id=request.form.get('insurance_report_id', type=int),
                payment_no=request.form.get('payment_no', ''),
                payment_time=payment_time,
                amount=request.form['amount'],
                payment_method=request.form.get('payment_method', ''),
                payee=request.form.get('payee', ''),
                status=request.form.get('status', '处理中'),
                remarks=request.form.get('remarks', '')
            )
            
            db.session.add(payment)
            db.session.commit()
            flash('赔付记录已添加！', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'添加失败：{str(e)}', 'error')
        
        return redirect(url_for('event_detail', event_id=event_id))
    
    @app.route('/events/<int:event_id>/feedback', methods=['POST'])
    def add_feedback(event_id):
        try:
            feedback = ExceptionFeedback(
                event_id=event_id,
                feedback_type=request.form['feedback_type'],
                content=request.form['content'],
                feedback_by=request.form['feedback_by']
            )
            
            db.session.add(feedback)
            db.session.commit()
            flash('异常反馈已提交！', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'提交失败：{str(e)}', 'error')
        
        return redirect(url_for('event_detail', event_id=event_id))
    
    @app.route('/feedback/<int:feedback_id>/handle', methods=['POST'])
    def handle_feedback(feedback_id):
        feedback = ExceptionFeedback.query.get_or_404(feedback_id)
        feedback.handled = True
        feedback.handle_note = request.form.get('handle_note', '')
        feedback.handled_at = datetime.utcnow()
        db.session.commit()
        flash('反馈已处理！', 'success')
        return redirect(request.referrer or url_for('dashboard'))
    
    @app.route('/api/stats')
    def api_stats():
        events = InjuryEvent.query.all()
        stats = {
            'total': len(events),
            'by_status': {},
            'by_severity': {},
            'by_risk': {}
        }
        
        for e in events:
            stats['by_status'][e.status] = stats['by_status'].get(e.status, 0) + 1
            stats['by_severity'][e.severity] = stats['by_severity'].get(e.severity, 0) + 1
            stats['by_risk'][e.risk_level] = stats['by_risk'].get(e.risk_level, 0) + 1
        
        return jsonify(stats)
    
    def get_status_color(status):
        colors = {
            '待处理': 'bg-yellow-100 text-yellow-800',
            '现场处置中': 'bg-blue-100 text-blue-800',
            '已报案': 'bg-purple-100 text-purple-800',
            '跟进中': 'bg-orange-100 text-orange-800',
            '已结案': 'bg-green-100 text-green-800',
            '已归档': 'bg-gray-100 text-gray-800'
        }
        return colors.get(status, 'bg-gray-100 text-gray-800')
    
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5001)
