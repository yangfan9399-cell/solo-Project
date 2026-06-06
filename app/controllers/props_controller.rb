class PropsController < ApplicationController
  before_action :set_prop, only: [:show, :edit, :update, :destroy, :borrow_history, :inspection_history, :compensation_history]

  def index
    @props = Prop.all
    @props = @props.by_category(params[:category]) if params[:category].present?
    @props = @props.by_status(params[:status]) if params[:status].present?
    @props = @props.order(:name).page(params[:page]).per(20) if defined?(Kaminari)
    @categories = Prop.categories
  end

  def show
    @current_borrow = @prop.current_borrow_record
    @borrow_records = @prop.borrow_records.order(created_at: :desc).limit(10)
    @inspection_records = InspectionRecord.joins(:borrow_record)
      .where(borrow_records: { prop_id: @prop.id })
      .order("inspection_records.created_at DESC")
      .limit(10)
    @compensations = Compensation.joins(:borrow_record).where(borrow_records: { prop_id: @prop.id }).order(created_at: :desc).limit(10)
    @repair_records = @prop.repair_records.order(created_at: :desc).limit(5)
  end

  def new
    @prop = Prop.new
  end

  def create
    @prop = Prop.new(prop_params)
    if @prop.save
      redirect_to @prop, notice: "道具创建成功"
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @prop.update(prop_params)
      redirect_to @prop, notice: "道具更新成功"
    else
      render :edit
    end
  end

  def destroy
    @prop.destroy
    redirect_to props_url, notice: "道具已删除"
  end

  def borrow_history
    @borrow_records = @prop.borrow_records.order(created_at: :desc)
  end

  def inspection_history
    @inspection_records = InspectionRecord.joins(:borrow_record)
      .where(borrow_records: { prop_id: @prop.id })
      .order("inspection_records.created_at DESC")
  end

  def compensation_history
    @compensations = Compensation.joins(:borrow_record)
      .where(borrow_records: { prop_id: @prop.id })
      .order(created_at: :desc)
  end

  def categories
    @categories = Prop.categories
    render json: @categories
  end

  def check_conflict
    prop = Prop.find(params[:prop_id])
    start_date = params[:start_date]
    end_date = params[:end_date]
    exclude_id = params[:exclude_id]

    has_conflict = prop.has_conflict?(start_date, end_date, exclude_id)
    conflicting = prop.conflicting_records(start_date, end_date, exclude_id)

    render json: {
      has_conflict: has_conflict,
      conflicting_records: conflicting.as_json(include: { crew: { only: [:name, :play_name] } }, only: [:id, :expected_start_date, :expected_end_date, :status])
    }
  end

  def available_slots
    prop = Prop.find(params[:prop_id])
    start_date = params[:start_date] || Date.today
    end_date = params[:end_date] || 30.days.from_now
    duration = params[:duration]&.to_i || 3

    slots = prop.find_available_slots(start_date, end_date, duration)
    render json: { slots: slots }
  end

  private

  def set_prop
    @prop = Prop.find(params[:id])
  end

  def prop_params
    params.require(:prop).permit(:name, :category, :code, :description, :status, :value, :photo_url, :notes)
  end
end
