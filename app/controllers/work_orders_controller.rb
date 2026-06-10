class WorkOrdersController < ApplicationController
  before_action :set_work_order, only: [:show, :edit, :update, :destroy, :submit_proof, :measure_color, :confirm, :reject, :start_production, :complete]

  def index
    @work_orders = WorkOrder.includes(:customer, :proofs).order(created_at: :desc)
    @status_filter = params[:status]
    if @status_filter.present?
      @work_orders = @work_orders.where(status: @status_filter)
    end
  end

  def show
    @proof = @work_order.proofs.build
    @color_measurement = ColorMeasurement.new
    @history = @work_order.work_order_histories.order(created_at: :desc)
  end

  def new
    @work_order = WorkOrder.new
    @work_order.status = 'draft'
    @customers = Customer.all
  end

  def create
    @work_order = WorkOrder.new(work_order_params)
    @work_order.status = 'draft'
    
    if @work_order.save
      @work_order.work_order_histories.create!(
        previous_status: nil,
        current_status: 'draft',
        operator: current_operator,
        action: '创建工单',
        remark: '工单创建'
      )
      redirect_to @work_order, notice: '工单创建成功'
    else
      @customers = Customer.all
      render :new
    end
  end

  def edit
    @customers = Customer.all
  end

  def update
    if @work_order.update(work_order_params)
      redirect_to @work_order, notice: '工单更新成功'
    else
      @customers = Customer.all
      render :edit
    end
  end

  def destroy
    @work_order.destroy
    redirect_to work_orders_url, notice: '工单已删除'
  end

  def submit_proof
    version = (@work_order.proofs.maximum(:version) || 0) + 1
    @work_order.proofs.create!(
      version: version,
      submitter: current_operator,
      submitted_at: Time.now,
      status: 'pending'
    )
    
    if @work_order.update_status('proof_submitted', current_operator, "提交打样 v#{version}")
      redirect_to @work_order, notice: '打样提交成功'
    else
      redirect_to @work_order, alert: '打样提交失败'
    end
  end

  def measure_color
    proof = @work_order.latest_proof
    return redirect_to @work_order, alert: '请先提交打样' unless proof

    measurement = proof.color_measurements.create!(color_measurement_params)
    measurement.is_qualified = measurement.delta_e < 3.0
    measurement.save!
    
    proof.status = measurement.is_qualified ? 'measured' : 'measured'
    proof.save!
    
    if @work_order.update_status('color_measured', current_operator, "色差检测完成，ΔE=#{measurement.delta_e}")
      redirect_to @work_order, notice: '色差检测完成'
    else
      redirect_to @work_order, alert: '色差检测失败'
    end
  end

  def confirm
    if @work_order.update_status('customer_confirmed', current_operator, '客户确认')
      redirect_to @work_order, notice: '客户确认成功'
    else
      redirect_to @work_order, alert: '确认失败'
    end
  end

  def reject
    reason = params[:reject_reason]
    if @work_order.update_status('rejected', current_operator, "客户拒绝：#{reason}")
      redirect_to @work_order, notice: '已拒绝并进入返工流程'
    else
      redirect_to @work_order, alert: '操作失败'
    end
  end

  def start_production
    if !@work_order.can_proceed_to_production?
      if @work_order.has_color_deviation?
        redirect_to @work_order, alert: '色差超标，禁止进入批量生产'
      else
        redirect_to @work_order, alert: '请先完成客户确认'
      end
    elsif @work_order.update_status('in_production', current_operator, '开始批量生产')
      redirect_to @work_order, notice: '已进入批量生产'
    else
      redirect_to @work_order, alert: '操作失败'
    end
  end

  def complete
    if @work_order.update_status('completed', current_operator, '工单完成')
      redirect_to @work_order, notice: '工单已完成'
    else
      redirect_to @work_order, alert: '操作失败'
    end
  end

  private

  def set_work_order
    @work_order = WorkOrder.find(params[:id])
  end

  def work_order_params
    params.require(:work_order).permit(:customer_id, :category, :target_color, :paper_type, :machine, :responsible_person, :remark)
  end

  def color_measurement_params
    params.require(:color_measurement).permit(:l_value, :a_value, :b_value, :delta_e, :remark).merge(
      inspector: current_operator,
      measured_at: Time.now
    )
  end

  def current_operator
    params[:operator] || '系统用户'
  end
end