class BorrowRecordsController < ApplicationController
  before_action :set_borrow_record, only: [:show, :edit, :update, :destroy, :confirm, :checkout, :return, :audit_return, :start_compensation, :start_repair, :cancel, :conflicts]
  before_action :require_stage_manager, only: [:new, :create, :return, :cancel]
  before_action :require_crew_leader, only: [:confirm]
  before_action :require_asset_auditor, only: [:checkout, :audit_return, :start_compensation, :start_repair]

  def index
    @borrow_records = BorrowRecord.all.includes(:prop, :crew, :applicant)
    @borrow_records = @borrow_records.by_status(params[:status]) if params[:status].present?
    @borrow_records = @borrow_records.by_crew(params[:crew_id]) if params[:crew_id].present?
    @borrow_records = @borrow_records.by_prop(params[:prop_id]) if params[:prop_id].present?
    @borrow_records = @borrow_records.order(created_at: :desc)
  end

  def active
    @borrow_records = BorrowRecord.active.order(created_at: :desc).includes(:prop, :crew, :applicant)
    render :index
  end

  def overdue
    @borrow_records = BorrowRecord.overdue.order(created_at: :desc).includes(:prop, :crew, :applicant)
    render :index
  end

  def show
    @inspection_records = @borrow_record.inspection_records.order(created_at: :asc)
    @compensation = @borrow_record.compensation
    @repair_record = @borrow_record.repair_record
  end

  def new
    @borrow_record = BorrowRecord.new
    @borrow_record.prop_id = params[:prop_id] if params[:prop_id].present?
    @props = Prop.available.order(:name)
    @crews = Crew.all.order(:name)
    @users = User.stage_manager.order(:name)
  end

  def create
    @borrow_record = BorrowRecord.new(borrow_record_params)
    @borrow_record.applicant = current_user
    @borrow_record.status = :pending

    if @borrow_record.save
      redirect_to @borrow_record, notice: "借调申请已提交，请等待剧组负责人确认"
    else
      @props = Prop.available.order(:name)
      @crews = Crew.all.order(:name)
      @users = User.stage_manager.order(:name)
      render :new
    end
  end

  def edit
    @props = Prop.all.order(:name)
    @crews = Crew.all.order(:name)
    @users = User.all.order(:name)
  end

  def update
    if @borrow_record.update(borrow_record_params)
      redirect_to @borrow_record, notice: "借调记录更新成功"
    else
      @props = Prop.all.order(:name)
      @crews = Crew.all.order(:name)
      @users = User.all.order(:name)
      render :edit
    end
  end

  def destroy
    @borrow_record.destroy
    redirect_to borrow_records_url, notice: "借调记录已删除"
  end

  def confirm
    if @borrow_record.confirm_by!(current_user)
      redirect_to @borrow_record, notice: "借调已确认，可以安排出库"
    else
      if @borrow_record.has_conflict?
        flash[:alert] = "借调冲突：该道具在所选时间段内已被其他剧组借出"
      else
        flash[:alert] = "确认失败，请检查借调状态"
      end
      redirect_to @borrow_record
    end
  end

  def checkout
    if @borrow_record.checkout_by!(current_user)
      redirect_to @borrow_record, notice: "道具已出库"
    else
      redirect_to @borrow_record, alert: "出库失败，请检查借调状态"
    end
  end

  def return
    return_notes = params[:return_notes]
    condition = params[:condition] || :good

    if @borrow_record.return_by!(current_user, return_notes, condition)
      redirect_to @borrow_record, notice: "归还申请已提交，请等待资产复核人审核"
    else
      redirect_to @borrow_record, alert: "归还申请失败，请检查借调状态"
    end
  end

  def audit_return
    result = params[:result]&.to_sym || :returned
    damage_type = params[:damage_type]
    damage_description = params[:damage_description]

    if @borrow_record.audit_return!(current_user, result: result, damage_type: damage_type, damage_description: damage_description)
      if result == :damaged
        redirect_to @borrow_record, notice: "归还审核完成，道具已标记为破损，请安排赔付或维修"
      else
        redirect_to @borrow_record, notice: "归还审核完成，道具已归还入库"
      end
    else
      redirect_to @borrow_record, alert: "审核失败，请检查借调状态"
    end
  end

  def start_compensation
    amount = params[:amount]
    basis = params[:basis]

    if @borrow_record.start_compensation!(current_user, amount, basis)
      redirect_to @borrow_record, notice: "赔付流程已启动"
    else
      redirect_to @borrow_record, alert: "启动赔付失败"
    end
  end

  def start_repair
    damage_description = params[:damage_description]
    cost = params[:cost]

    if @borrow_record.start_repair!(current_user, damage_description, cost)
      redirect_to @borrow_record, notice: "维修流程已启动"
    else
      redirect_to @borrow_record, alert: "启动维修失败"
    end
  end

  def cancel
    if @borrow_record.pending? || @borrow_record.confirmed?
      @borrow_record.update!(status: :cancelled)
      @borrow_record.prop.available! if @borrow_record.prop.borrowed?
      redirect_to borrow_records_url, notice: "借调已取消"
    else
      redirect_to @borrow_record, alert: "当前状态无法取消"
    end
  end

  def conflicts
    @conflicting_records = @borrow_record.conflicting_records
    @alternative_slots = @borrow_record.available_alternative_slots
  end

  private

  def set_borrow_record
    @borrow_record = BorrowRecord.find(params[:id])
  end

  def borrow_record_params
    params.require(:borrow_record).permit(:prop_id, :crew_id, :expected_start_date, :expected_end_date, :purpose)
  end
end
