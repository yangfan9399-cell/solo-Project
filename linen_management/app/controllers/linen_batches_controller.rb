class LinenBatchesController < ApplicationController
  before_action :set_linen_batch, only: [
    :show, :edit, :update, :destroy,
    :collect, :wash_complete, :return_batch, :inspect,
    :confirm_discrepancy, :settle
  ]

  def index
    @linen_batches = LinenBatch.recent
                                .by_status(params[:status])
                                .by_hotel(params[:hotel_id])
    @hotels = Hotel.all.order(:name)
    @statuses = LinenBatch::STATUSES
  end

  def show
    @linen_items = @linen_batch.linen_items.includes(:linen_type)
    @damage_claims = @linen_batch.damage_claims.includes(:linen_type, :confirmed_by)
    @events = @linen_batch.events.includes(:user).chronological
  end

  def new
    @linen_batch = LinenBatch.new
    @hotels = Hotel.all.order(:name)
    @linen_types = LinenType.all.order(:name)
  end

  def create
    @linen_batch = LinenBatch.new(linen_batch_params)

    if @linen_batch.save
      @linen_batch.add_event('created', current_user, '创建布草批次')
      redirect_to @linen_batch, notice: '布草批次创建成功。'
    else
      @hotels = Hotel.all.order(:name)
      @linen_types = LinenType.all.order(:name)
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @hotels = Hotel.all.order(:name)
    @linen_types = LinenType.all.order(:name)
  end

  def update
    if @linen_batch.update(linen_batch_params)
      redirect_to @linen_batch, notice: '布草批次更新成功。'
    else
      @hotels = Hotel.all.order(:name)
      @linen_types = LinenType.all.order(:name)
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @linen_batch.destroy
    redirect_to linen_batches_url, notice: '布草批次已删除。'
  end

  def collect
    if @linen_batch.collect!(current_user)
      redirect_to @linen_batch, notice: '布草已成功交接。'
    else
      redirect_to @linen_batch, alert: '操作失败，当前状态不允许交接。'
    end
  end

  def wash_complete
    if @linen_batch.wash_complete!(current_user)
      redirect_to @linen_batch, notice: '洗涤已完成。'
    else
      redirect_to @linen_batch, alert: '操作失败，当前状态不允许完成洗涤。'
    end
  end

  def return_batch
    if @linen_batch.return!(current_user)
      redirect_to @linen_batch, notice: '返还登记成功。'
    else
      redirect_to @linen_batch, alert: '操作失败，当前状态不允许返还。'
    end
  end

  def inspect
    ActiveRecord::Base.transaction do
      if params[:linen_items].present?
        params[:linen_items].each do |item_id, item_params|
          item = @linen_batch.linen_items.find(item_id)
          item.update!(
            quantity_returned: item_params[:quantity_returned],
            quantity_clean: item_params[:quantity_clean],
            quantity_stained: item_params[:quantity_stained],
            quantity_damaged: item_params[:quantity_damaged]
          )
        end
      end

      if @linen_batch.inspect!(current_user)
        generate_damage_claims if @linen_batch.has_quality_issues? || @linen_batch.has_shortage?
        redirect_to @linen_batch, notice: '质检完成。'
      else
        redirect_to @linen_batch, alert: '操作失败，当前状态不允许质检。'
      end
    end
  rescue => e
    redirect_to @linen_batch, alert: "质检失败: #{e.message}"
  end

  def confirm_discrepancy
    side = params[:side]
    if @linen_batch.confirm_discrepancy!(current_user, side)
      redirect_to @linen_batch, notice: '差异确认成功。'
    else
      redirect_to @linen_batch, alert: '操作失败。'
    end
  end

  def settle
    if @linen_batch.settle!(current_user)
      redirect_to @linen_batch, notice: '结算完成。'
    else
      redirect_to @linen_batch, alert: '结算失败，请确保所有赔损已确认且无数量短少。'
    end
  end

  private

  def set_linen_batch
    @linen_batch = LinenBatch.find(params[:id])
  end

  def linen_batch_params
    params.require(:linen_batch).permit(:batch_number, :hotel_id, :status, :notes)
  end

  def generate_damage_claims
    @linen_batch.linen_items.each do |item|
      if item.quantity_damaged.to_i > 0
        @linen_batch.damage_claims.find_or_create_by!(
          linen_type: item.linen_type,
          reason: 'damaged'
        ) do |claim|
          claim.quantity = item.quantity_damaged
          claim.unit_price = item.linen_type.unit_price
        end
        @linen_batch.add_event('claim_created', current_user, "生成#{item.linen_type.name}破损赔损")
      end

      if item.quantity_stained.to_i > 0
        @linen_batch.damage_claims.find_or_create_by!(
          linen_type: item.linen_type,
          reason: 'stained'
        ) do |claim|
          claim.quantity = item.quantity_stained
          claim.unit_price = item.linen_type.unit_price * 0.5
        end
        @linen_batch.add_event('claim_created', current_user, "生成#{item.linen_type.name}污渍赔损")
      end

      if item.quantity_short.to_i > 0
        @linen_batch.damage_claims.find_or_create_by!(
          linen_type: item.linen_type,
          reason: 'shortage'
        ) do |claim|
          claim.quantity = item.quantity_short
          claim.unit_price = item.linen_type.unit_price
        end
        @linen_batch.add_event('claim_created', current_user, "生成#{item.linen_type.name}短少赔损")
      end
    end
  end
end
