class CoursePackagesController < ApplicationController
  before_action :set_course_package, only: %i[show consume exchange transfer request_refund approve reject archive reopen]
  before_action :set_current_user

  def index
    @course_packages = CoursePackage.includes(:member, :consultant).order(created_at: :desc)
  end

  def show
    @consumption_records = @course_package.consumption_records.order(performed_at: :desc)
    @review_nodes = @course_package.review_nodes.order(created_at: :desc)
    @responsibility_changes = @course_package.responsibility_changes.order(transferred_at: :desc)
    @customer_notes = @course_package.customer_notes.order(created_at: :desc)
  end

  def consume
    return render_readonly if @course_package.archived?
    return render_no_permission unless @current_user.consultant?

    if @course_package.consume_service!(
      params[:service_name],
      params[:sessions_used].to_i,
      @current_user,
      params[:customer_notes],
      'normal'
    )
      redirect_to @course_package, notice: '服务消耗登记成功'
    else
      redirect_to @course_package, alert: '服务消耗登记失败'
    end
  end

  def exchange
    return render_readonly if @course_package.archived?
    return render_no_permission unless @current_user.consultant?

    if @course_package.consume_service!(
      params[:service_name],
      params[:sessions_used].to_i,
      @current_user,
      params[:customer_notes],
      'exchange'
    )
      redirect_to @course_package, notice: '项目换购登记成功'
    else
      redirect_to @course_package, alert: '项目换购登记失败'
    end
  end

  def transfer
    return render_readonly if @course_package.archived?
    return render_no_permission unless @current_user.manager?

    to_consultant = User.find(params[:to_consultant_id])
    if @course_package.transfer_consultant!(to_consultant, @current_user, params[:transfer_reason])
      redirect_to @course_package, notice: '顾问转交成功'
    else
      redirect_to @course_package, alert: '顾问转交失败'
    end
  end

  def request_refund
    return render_readonly if @course_package.archived?
    return render_no_permission unless @current_user.manager?

    if @course_package.request_refund!(@current_user, params[:algorithm], params[:dispute_reason])
      redirect_to @course_package, notice: '退款申请已提交'
    else
      redirect_to @course_package, alert: '退款申请提交失败'
    end
  end

  def approve
    return render_readonly if @course_package.archived?
    return render_no_permission unless @current_user.manager?

    review_node = @course_package.current_review_node
    if review_node&.approve!(params[:manager_notes])
      redirect_to @course_package, notice: '退款已批准'
    else
      redirect_to @course_package, alert: '退款批准失败'
    end
  end

  def reject
    return render_readonly if @course_package.archived?
    return render_no_permission unless @current_user.manager?

    review_node = @course_package.current_review_node
    if review_node&.reject!(params[:manager_notes])
      redirect_to @course_package, notice: '退款已退回'
    else
      redirect_to @course_package, alert: '退款退回失败'
    end
  end

  def archive
    return render_no_permission unless @current_user.manager?

    review_node = @course_package.current_review_node
    if review_node&.archive!
      redirect_to @course_package, notice: '已归档'
    else
      redirect_to @course_package, alert: '归档失败'
    end
  end

  def reopen
    return render_no_permission unless @current_user.manager?

    review_node = @course_package.review_nodes.find(params[:review_node_id])
    if review_node.reopen!(@current_user, params[:new_algorithm], params[:dispute_reason])
      redirect_to @course_package, notice: '已重新发起复核'
    else
      redirect_to @course_package, alert: '重新发起复核失败'
    end
  end

  def add_note
    return render_readonly if @course_package.archived?
    return render_no_permission unless @current_user.consultant? || @current_user.manager?

    if @course_package.add_customer_note!(params[:content], @current_user, params[:note_type] || 'general')
      redirect_to @course_package, notice: '客户说明已添加'
    else
      redirect_to @course_package, alert: '客户说明添加失败'
    end
  end

  private

  def set_course_package
    @course_package = CoursePackage.find(params[:id])
  end

  def set_current_user
    @current_user = User.find_by(id: session[:user_id]) || User.first
    session[:user_id] = @current_user.id if @current_user
  end

  def render_readonly
    redirect_to @course_package, alert: '已归档，无法修改'
  end

  def render_no_permission
    redirect_to @course_package, alert: '无权限执行此操作'
  end
end
